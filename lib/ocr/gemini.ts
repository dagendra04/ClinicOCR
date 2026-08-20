/**
 * Google Gemini Flash integration for OCR post-processing.
 * Receives raw OCR text and returns structured medical data.
 *
 * Resilience strategy:
 *  - Exponential back-off retry (up to MAX_RETRIES) for transient 503/429 errors.
 *  - Model fallback chain: gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-pro
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Medicine } from '@/db/schema';

export interface GeminiResult {
  correctedText:      string;
  summary:            string;
  medicines:          Medicine[];
  importantFindings:  string[];
  tags:               string[];
}

// --------------------------------------------------------------------------- //
// Config
// --------------------------------------------------------------------------- //

/**
 * Ordered fallback model chain — first healthy model wins.
 * Uses stable versioned IDs (not aliases) so they never silently change.
 * Priority: latest Flash first (fast + cheap) → older Flash → Pro fallback.
 */
const MODEL_CHAIN = [
  'gemini-3.6-flash',      // latest stable Flash
  'gemini-3.6-pro',        // Pro fallback
] as const;

/** Maximum retries per model before moving to the next in the chain. */
const MAX_RETRIES = 3;

/** Initial delay in ms; doubles with each retry (exponential back-off). */
const BASE_DELAY_MS = 1_000;

// --------------------------------------------------------------------------- //
// Prompt
// --------------------------------------------------------------------------- //

// Prompt asks for JSON inside a fenced block — more reliable across model versions
const SYSTEM_PROMPT = `You are a medical document AI assistant. You will receive raw OCR text extracted from a handwritten prescription.

Your tasks:
1. Correct obvious OCR errors (e.g., "0" vs "O", "1" vs "l", spacing issues)
2. Format the text cleanly preserving all original medical information
3. Extract all medicines with dosage and frequency
4. Generate a concise 1-2 sentence clinical summary
5. List important findings (allergies, critical notes, etc.)
6. Generate relevant tags (e.g., "Fever", "Antibiotic", "Pediatric")

CRITICAL RULES:
- NEVER hallucinate or invent information not present in the OCR text
- If a medicine name is uncertain, prefix it with "Possibly "
- Preserve all original medical data even if unusual
- Return ONLY a valid JSON object — no explanation, no markdown, no extra text

JSON structure to return:
{
  "corrected_text": "cleaned full text of the prescription",
  "summary": "brief 1-2 sentence summary",
  "medicines": [
    {"name": "medicine name", "dosage": "dosage or empty string", "frequency": "frequency or empty string"}
  ],
  "important_findings": ["finding 1", "finding 2"],
  "tags": ["tag1", "tag2"]
}`;

// --------------------------------------------------------------------------- //
// Helpers
// --------------------------------------------------------------------------- //

/** Extract JSON object from a string that may contain surrounding text/fences */
function extractJson(raw: string): string {
  const trimmed = raw.trim();

  // Strip markdown fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Extract first {...} block
  const braceStart = trimmed.indexOf('{');
  const braceEnd   = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }

  return trimmed;
}

/** Returns true for errors that are worth retrying (transient server-side issues). */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // 503 Service Unavailable, 429 Too Many Requests, network timeouts
  return (
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('network')
  );
}

/** Async sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query the Gemini models.list endpoint and return model IDs that support
 * generateContent, preferring Flash then Pro, as a dynamic last-resort chain.
 */
async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
    };
    const all = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace('models/', ''));

    // Prefer Flash models first, then Pro, filter out experimental/preview noise
    const flash = all.filter((id) => id.includes('flash') && !id.includes('thinking'));
    const pro   = all.filter((id) => id.includes('pro')   && !id.includes('thinking'));
    return [...flash, ...pro];
  } catch {
    return [];
  }
}

/**
 * Attempt a single Gemini API call with exponential back-off retries.
 * Throws after MAX_RETRIES exhausted or for non-retryable errors.
 */
async function callWithRetry(
  genAI:  GoogleGenerativeAI,
  model:  string,
  prompt: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature:      0.1,
          topP:             0.9,
          maxOutputTokens:  2048,
          responseMimeType: 'application/json', // force JSON output mode
        },
      });

      const result = await geminiModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      const retryable = isRetryable(err);
      const isLast    = attempt === MAX_RETRIES;

      console.warn(
        `[Gemini] Model "${model}" attempt ${attempt}/${MAX_RETRIES} failed:`,
        err instanceof Error ? err.message : err,
      );

      if (!retryable || isLast) throw err; // bubble up to model fallback

      // Exponential back-off: 1s, 2s, 4s, …
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.info(`[Gemini] Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }

  // Should never reach here due to the throw inside the loop
  throw new Error(`[Gemini] All ${MAX_RETRIES} attempts failed for model "${model}"`);
}

// --------------------------------------------------------------------------- //
// Public API
// --------------------------------------------------------------------------- //

export async function processWithGemini(rawOcrText: string): Promise<GeminiResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = `${SYSTEM_PROMPT}\n\nRAW OCR TEXT:\n${rawOcrText}`;

  let rawText = '';
  let lastErr: unknown;

  // Try each model in the fallback chain
  for (const model of MODEL_CHAIN) {
    try {
      console.info(`[Gemini] Trying model: ${model}`);
      rawText = await callWithRetry(genAI, model, prompt);
      console.info(`[Gemini] Success with model: ${model}`);
      break; // got a response — exit the fallback loop
    } catch (err) {
      lastErr = err;
      console.error(
        `[Gemini] Model "${model}" exhausted retries:`,
        err instanceof Error ? err.message : err,
      );
      // Continue to next model in chain
    }
  }

  // ----------------------------------------------------------------------- //
  // Dynamic model discovery — last resort when all static models fail
  // ----------------------------------------------------------------------- //
  if (!rawText) {
    console.info('[Gemini] Static chain exhausted. Discovering available models…');
    const dynamicModels = await fetchAvailableModels(process.env.GEMINI_API_KEY!);
    // Skip any models we already tried
    const alreadyTried = new Set(MODEL_CHAIN as readonly string[]);
    const candidates   = dynamicModels.filter((m) => !alreadyTried.has(m));
    console.info(`[Gemini] Dynamic candidates: ${candidates.join(', ') || 'none'}`);

    for (const model of candidates) {
      try {
        console.info(`[Gemini] Trying dynamic model: ${model}`);
        rawText = await callWithRetry(genAI, model, prompt);
        console.info(`[Gemini] Success with dynamic model: ${model}`);
        break;
      } catch (err) {
        lastErr = err;
        console.error(
          `[Gemini] Dynamic model "${model}" failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  // All models failed — surface a clear error
  if (!rawText) {
    const message =
      lastErr instanceof Error ? lastErr.message : 'Unknown Gemini API error';
    throw new Error(
      `[Gemini] All models in the fallback chain failed. Last error: ${message}`,
    );
  }

  // ----------------------------------------------------------------------- //
  // Parse response
  // ----------------------------------------------------------------------- //

  const jsonText = extractJson(rawText);

  let parsed: {
    corrected_text:     string;
    summary:            string;
    medicines:          Array<{ name: string; dosage: string; frequency: string }>;
    important_findings: string[];
    tags:               string[];
  };

  try {
    parsed = JSON.parse(jsonText);
  } catch (parseErr) {
    console.error('[Gemini] JSON parse failed. Raw response was:\n', rawText);
    return {
      correctedText:     rawOcrText,
      summary:           'AI processing encountered an issue. Please review the raw OCR text.',
      medicines:         [],
      importantFindings: [],
      tags:              [],
    };
  }

  return {
    correctedText:     parsed.corrected_text     ?? rawOcrText,
    summary:           parsed.summary            ?? '',
    medicines:         (parsed.medicines         ?? []).map((m) => ({
      name:      m.name      ?? '',
      dosage:    m.dosage    ?? '',
      frequency: m.frequency ?? '',
    })),
    importantFindings: parsed.important_findings ?? [],
    tags:              parsed.tags               ?? [],
  };
}
