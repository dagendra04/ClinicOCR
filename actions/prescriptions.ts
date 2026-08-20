'use server';

import { db } from '@/db';
import { prescriptions, patients } from '@/db/schema';
import { eq, desc, ilike, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { preprocessImage, checkImageQuality } from '@/lib/ocr/preprocess';
import { runOcr } from '@/lib/ocr/tesseract';
import { processWithGemini } from '@/lib/ocr/gemini';
import type { NewPrescription, Medicine } from '@/db/schema';

// ─── Full pipeline: preprocess → OCR → Gemini ─────────────────────────────

export async function analyzePrescrip(base64Image: string) {
  try {
    // 1. Quality check
    const quality = await checkImageQuality(base64Image);

    // 2. Preprocess
    const processed = await preprocessImage(base64Image);

    // 3. OCR
    const ocr = await runOcr(processed.base64);

    // 4. Gemini
    const ai = await processWithGemini(ocr.text);

    return {
      success: true,
      data: {
        qualityCheck:     quality,
        rawOcr:           ocr.text,
        ocrConfidence:    ocr.confidence,
        ocrWords:         ocr.words,
        correctedText:    ai.correctedText,
        summary:          ai.summary,
        medicines:        ai.medicines,
        importantFindings: ai.importantFindings,
        tags:             ai.tags,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return { success: false, error: message };
  }
}

// ─── Save prescription ────────────────────────────────────────────────────

export async function savePrescription(data: {
  patientId:         string;
  imageBase64:       string;
  rawOcr:            string;
  correctedText:     string;
  aiSummary:         string;
  medicines:         Medicine[];
  importantFindings: string[];
  tags:              string[];
  ocrConfidence:     number;
  doctorNotes?:      string;
  important?:        boolean;
}) {
  try {
    const newRx: NewPrescription = {
      patientId:         data.patientId,
      imageBase64:       data.imageBase64,
      rawOcr:            data.rawOcr,
      correctedText:     data.correctedText,
      aiSummary:         data.aiSummary,
      medicinesJson:     data.medicines,
      importantFindings: data.importantFindings,
      tags:              data.tags,
      ocrConfidence:     data.ocrConfidence,
      doctorNotes:       data.doctorNotes ?? null,
      important:         data.important ?? false,
    };

    const [created] = await db.insert(prescriptions).values(newRx).returning();

    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath('/dashboard');

    return { success: true, data: created };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return { success: false, error: message };
  }
}

// ─── Get prescriptions ───────────────────────────────────────────────────

export async function getPrescriptionsByPatient(patientId: string) {
  return db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.important), desc(prescriptions.createdAt));
}

export async function getPrescriptionById(id: string) {
  const result = await db
    .select({
      prescription: prescriptions,
      patient:      patients,
    })
    .from(prescriptions)
    .leftJoin(patients, eq(prescriptions.patientId, patients.id))
    .where(eq(prescriptions.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function getRecentPrescriptions(limit = 5) {
  return db
    .select({
      prescription: prescriptions,
      patient:      patients,
    })
    .from(prescriptions)
    .leftJoin(patients, eq(prescriptions.patientId, patients.id))
    .orderBy(desc(prescriptions.createdAt))
    .limit(limit);
}

// ─── Search prescriptions ─────────────────────────────────────────────────

export async function searchPrescriptions(query: string) {
  return db
    .select({
      prescription: prescriptions,
      patient:      patients,
    })
    .from(prescriptions)
    .leftJoin(patients, eq(prescriptions.patientId, patients.id))
    .where(
      or(
        ilike(patients.name,  `%${query}%`),
        ilike(patients.phone, `%${query}%`),
        ilike(prescriptions.correctedText, `%${query}%`),
        ilike(prescriptions.rawOcr, `%${query}%`),
        sql`${prescriptions.tags}::text ILIKE ${'%' + query + '%'}`,
        sql`${prescriptions.medicinesJson}::text ILIKE ${'%' + query + '%'}`,
      )
    )
    .orderBy(desc(prescriptions.createdAt));
}

// ─── Update doctor notes / important ─────────────────────────────────────

export async function updatePrescriptionMeta(
  id: string,
  data: { doctorNotes?: string; important?: boolean }
) {
  try {
    await db
      .update(prescriptions)
      .set(data)
      .where(eq(prescriptions.id, id));

    revalidatePath(`/prescriptions/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Update failed' };
  }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [patientCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patients);

  const [rxCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(prescriptions);

  const recent = await getRecentPrescriptions(5);

  return {
    totalPatients:     patientCount?.count     ?? 0,
    totalPrescriptions: rxCount?.count         ?? 0,
    recentPrescriptions: recent,
  };
}

// ─── Delete prescription ──────────────────────────────────────────────────

export async function deletePrescription(id: string, patientId: string) {
  try {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
    revalidatePath(`/patients/${patientId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: 'Delete failed' };
  }
}
