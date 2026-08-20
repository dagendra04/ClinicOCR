/**
 * Image preprocessing utilities for improving OCR accuracy.
 * Uses Jimp for: grayscale → contrast boost → sharpen → adaptive threshold
 * Returns processed image as base64 PNG
 */

import { Jimp } from 'jimp';

export interface PreprocessResult {
  base64: string;        // processed image as base64 (png)
  mimeType: 'image/png';
  width: number;
  height: number;
}

export interface QualityCheckResult {
  isBlurry:      boolean;
  isLowContrast: boolean;
  warnings:      string[];
  score:         number; // 0–100
}

/**
 * Preprocess a base64 image to improve OCR quality.
 * Accepts data URLs (data:image/...) or raw base64 strings.
 */
export async function preprocessImage(base64Input: string): Promise<PreprocessResult> {
  const base64 = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
  const buffer = Buffer.from(base64, 'base64');

  const image = await Jimp.read(buffer);

  // 1. Resize if too large (max 2400px wide for faster OCR)
  if (image.bitmap.width > 2400) {
    image.resize({ w: 2400 });
  }

  // 2. Grayscale
  image.greyscale();

  // 3. Normalize
  image.normalize();

  // 4. Contrast boost
  image.contrast(0.3);

  // 5. Sharpen via convolute
  image.convolute([
    [-1, -1, -1],
    [-1,  9, -1],
    [-1, -1, -1],
  ]);

  const processedBuffer = await image.getBuffer('image/png');
  const processedBase64 = processedBuffer.toString('base64');

  return {
    base64:   processedBase64,
    mimeType: 'image/png',
    width:    image.bitmap.width,
    height:   image.bitmap.height,
  };
}

/**
 * Analyze image quality before OCR to give user warnings.
 */
export async function checkImageQuality(base64Input: string): Promise<QualityCheckResult> {
  const base64 = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
  const buffer = Buffer.from(base64, 'base64');

  const image = await Jimp.read(buffer);
  const warnings: string[] = [];

  const gray = image.clone().greyscale();
  const data = gray.bitmap.data;
  const total = gray.bitmap.width * gray.bitmap.height;

  // ── Pixel statistics ──
  let sum   = 0;
  let sumSq = 0;
  let minPx = 255;
  let maxPx = 0;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = data[i]; // R channel (grayscale, all same)
    sum   += pixel;
    sumSq += pixel * pixel;
    if (pixel < minPx) minPx = pixel;
    if (pixel > maxPx) maxPx = pixel;
  }

  const mean     = sum / total;
  const variance = (sumSq / total) - (mean * mean);

  // ── Blur detection via variance ──
  const isBlurry = variance < 800;

  // ── Contrast detection ──
  const contrastRange  = maxPx - minPx;
  const isLowContrast  = contrastRange < 80;

  if (isBlurry)      warnings.push('Image appears blurry. Please upload a sharper photo.');
  if (isLowContrast) warnings.push('Low contrast detected. Ensure proper lighting.');

  // Score 0–100
  const blurScore     = Math.min(60, (variance / 1500) * 60);
  const contrastScore = Math.min(40, (contrastRange / 200) * 40);
  const score = Math.round(blurScore + contrastScore);

  return { isBlurry, isLowContrast, warnings, score };
}
