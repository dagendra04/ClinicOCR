'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Upload, ImageIcon, X, AlertTriangle, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, Star, StarOff,
  Save, RotateCcw, Pill, Sparkles, FileSearch,
} from 'lucide-react';
import { fileToBase64 } from '@/lib/utils';
import { analyzePrescrip, savePrescription } from '@/actions/prescriptions';
import type { Patient, Medicine } from '@/db/schema';
import type { OcrStatus } from '@/types';

interface UploadPrescriptionFormProps {
  patient:   Patient;
  allPatients: Patient[];
}

type Step = 'upload' | 'review' | 'saved';

interface AnalysisResult {
  rawOcr:            string;
  ocrConfidence:     number;
  correctedText:     string;
  summary:           string;
  medicines:         Medicine[];
  importantFindings: string[];
  tags:              string[];
  qualityCheck:      { warnings: string[]; score: number };
}

const STEP_LABELS: Record<OcrStatus, string> = {
  idle:           '',
  'quality-check': 'Checking image quality…',
  preprocessing:  'Preprocessing image…',
  ocr:            'Running Tesseract OCR…',
  ai:             'Gemini AI processing…',
  done:           'Analysis complete!',
  error:          'Analysis failed',
};

export default function UploadPrescriptionForm({ patient, allPatients }: UploadPrescriptionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [dragOver, setDragOver]       = useState(false);

  // Processing state
  const [step, setStep]             = useState<Step>('upload');
  const [ocrStatus, setOcrStatus]   = useState<OcrStatus>('idle');
  const [processing, setProcessing] = useState(false);

  // Results
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [showRawOcr, setShowRawOcr]   = useState(false);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);

  // Editable fields
  const [editedText, setEditedText]       = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedMeds, setEditedMeds]       = useState<Medicine[]>([]);
  const [editedTags, setEditedTags]       = useState<string[]>([]);
  const [editedFindings, setEditedFindings] = useState<string[]>([]);
  const [doctorNotes, setDoctorNotes]     = useState('');
  const [isImportant, setIsImportant]     = useState(false);
  const [saving, setSaving]               = useState(false);

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPG, JPEG, or PNG image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const base64 = await fileToBase64(file);
    setImageFile(file);
    setImagePreview(base64);
    setImageBase64(base64);
    setOcrStatus('idle');
    setResult(null);
    setStep('upload');
    setQualityWarnings([]);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64('');
    setResult(null);
    setStep('upload');
    setOcrStatus('idle');
    setQualityWarnings([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Analysis pipeline ────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!imageBase64) return;
    setProcessing(true);

    setOcrStatus('quality-check');
    await delay(300);

    setOcrStatus('preprocessing');
    await delay(300);

    setOcrStatus('ocr');

    const analysisResult = await analyzePrescrip(imageBase64);

    if (!analysisResult.success || !analysisResult.data) {
      setOcrStatus('error');
      setProcessing(false);
      toast.error(analysisResult.error ?? 'Analysis failed');
      return;
    }

    setOcrStatus('ai');
    await delay(200);

    const data = analysisResult.data;

    // Quality warnings
    if (data.qualityCheck.warnings.length > 0) {
      setQualityWarnings(data.qualityCheck.warnings);
    }

    setResult(data);
    setEditedText(data.correctedText);
    setEditedSummary(data.summary);
    setEditedMeds(data.medicines);
    setEditedTags(data.tags);
    setEditedFindings(data.importantFindings);

    setOcrStatus('done');
    setProcessing(false);
    setStep('review');
    toast.success('Analysis complete! Please review the results.');
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    const saveResult = await savePrescription({
      patientId:         patient.id,
      imageBase64:       imageBase64.split(',')[1] ?? imageBase64,
      rawOcr:            result.rawOcr,
      correctedText:     editedText,
      aiSummary:         editedSummary,
      medicines:         editedMeds,
      importantFindings: editedFindings,
      tags:              editedTags,
      ocrConfidence:     result.ocrConfidence,
      doctorNotes:       doctorNotes || undefined,
      important:         isImportant,
    });

    setSaving(false);

    if (saveResult.success && saveResult.data) {
      toast.success('Prescription saved successfully!');
      router.push(`/prescriptions/${saveResult.data.id}`);
    } else {
      toast.error(saveResult.error ?? 'Save failed');
    }
  };

  // ─── Medicine helpers ─────────────────────────────────────────────────────

  const updateMed = (index: number, field: keyof Medicine, value: string) => {
    setEditedMeds((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeMed = (index: number) => {
    setEditedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const addMed = () => {
    setEditedMeds((prev) => [...prev, { name: '', dosage: '', frequency: '' }]);
  };

  // ─── OCR confidence badge ──────────────────────────────────────────────────

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { label: 'Excellent', className: 'badge-green' };
    if (confidence >= 55) return { label: 'Good',      className: 'badge-yellow' };
    return                       { label: 'Needs Review', className: 'badge-red' };
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Quality Warnings */}
      {qualityWarnings.length > 0 && step === 'review' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Image Quality Warnings</p>
            <ul className="space-y-0.5">
              {qualityWarnings.map((w) => (
                <li key={w} className="text-sm text-amber-700">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {step === 'upload' && (
        <div className="card p-6">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-500" />
            Upload Prescription Image
          </h2>

          {!imagePreview ? (
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200
                ${dragOver
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-surface-border hover:border-brand-300 hover:bg-brand-50/50'
                }
              `}
            >
              <Upload className="w-10 h-10 text-text-muted mx-auto mb-4" />
              <p className="text-text-primary font-semibold mb-1">Drop prescription image here</p>
              <p className="text-text-muted text-sm mb-4">or click to browse</p>
              <p className="text-xs text-text-muted">Supports JPG, JPEG, PNG · Max 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden border border-surface-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Prescription preview"
                  className="w-full max-h-[400px] object-contain bg-slate-50"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">{imageFile?.name}</p>
                <p className="text-xs text-text-muted">
                  {imageFile ? (imageFile.size / 1024).toFixed(0) + ' KB' : ''}
                </p>
              </div>

              {/* Processing status */}
              {processing && (
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                    <p className="text-sm font-medium text-brand-700">
                      {STEP_LABELS[ocrStatus]}
                    </p>
                  </div>
                  {/* Progress steps */}
                  <div className="flex gap-2">
                    {(['quality-check', 'preprocessing', 'ocr', 'ai', 'done'] as OcrStatus[]).map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          isStatusComplete(s, ocrStatus) ? 'bg-brand-500' : 'bg-brand-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {ocrStatus === 'done' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700 font-medium">Analysis complete!</p>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={processing}
                className="btn-primary w-full py-3 justify-center"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {STEP_LABELS[ocrStatus]}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Prescription
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review step */}
      {step === 'review' && result && (
        <div className="space-y-5 animate-slide-up">
          {/* OCR Confidence */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSearch className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">OCR Analysis Complete</p>
                <p className="text-xs text-text-muted">Review and edit before saving</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={getConfidenceBadge(result.ocrConfidence).className}>
                {getConfidenceBadge(result.ocrConfidence).label}
              </span>
              <span className="text-sm font-semibold text-text-primary">{result.ocrConfidence}%</span>
              <button
                onClick={() => { setStep('upload'); setResult(null); }}
                className="btn-ghost text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Re-upload
              </button>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Image */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Original Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview!}
                alt="Prescription"
                className="w-full rounded-xl border border-surface-border object-contain max-h-64 bg-slate-50"
              />
            </div>

            {/* Raw OCR */}
            <div className="card p-4">
              <button
                onClick={() => setShowRawOcr((v) => !v)}
                className="flex items-center justify-between w-full mb-3"
              >
                <p className="text-sm font-semibold text-text-primary">Raw OCR Output</p>
                {showRawOcr ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
              </button>
              {showRawOcr ? (
                <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap bg-slate-50 rounded-xl p-3 max-h-52 overflow-y-auto">
                  {result.rawOcr || 'No text extracted'}
                </pre>
              ) : (
                <p className="text-xs text-text-muted italic">Click to view raw OCR output</p>
              )}
            </div>
          </div>

          {/* Corrected Text */}
          <div className="card p-5">
            <label className="text-sm font-semibold text-text-primary mb-2 block">
              Corrected Prescription Text
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="input font-mono text-sm resize-y prescription-text"
              placeholder="Corrected prescription text…"
            />
          </div>

          {/* AI Summary */}
          <div className="card p-5">
            <label className="text-sm font-semibold text-text-primary mb-2 block">
              AI Summary
            </label>
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={2}
              className="input text-sm resize-none"
              placeholder="Brief summary…"
            />
          </div>

          {/* Medicines */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Pill className="w-4 h-4 text-brand-500" />
                Medicines ({editedMeds.length})
              </h3>
              <button onClick={addMed} className="btn-secondary text-xs py-1 px-2.5">
                + Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {editedMeds.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-3">No medicines detected. Add manually.</p>
              ) : (
                editedMeds.map((med, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <input
                      value={med.name}
                      onChange={(e) => updateMed(i, 'name', e.target.value)}
                      placeholder="Medicine name"
                      className={`input text-sm ${med.name.startsWith('Possibly') ? 'border-amber-300 bg-amber-50' : ''}`}
                    />
                    <input
                      value={med.dosage}
                      onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                      placeholder="Dosage"
                      className="input text-sm"
                    />
                    <input
                      value={med.frequency}
                      onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                      placeholder="Frequency"
                      className="input text-sm"
                    />
                    <button onClick={() => removeMed(i)} className="text-text-muted hover:text-red-500 p-1 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Important Findings */}
          {editedFindings.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Important Findings</h3>
              <ul className="space-y-1.5">
                {editedFindings.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <input
                      value={f}
                      onChange={(e) => setEditedFindings((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                      className="input text-sm py-1"
                    />
                    <button onClick={() => setEditedFindings((prev) => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {editedTags.map((tag) => (
                <span
                  key={tag}
                  className="badge-blue flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                  onClick={() => setEditedTags((prev) => prev.filter((t) => t !== tag))}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </span>
              ))}
              {editedTags.length === 0 && (
                <p className="text-sm text-text-muted">No tags generated</p>
              )}
            </div>
          </div>

          {/* Doctor Notes + Important */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Doctor Notes</h3>
              <button
                onClick={() => setIsImportant((v) => !v)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isImportant ? 'text-amber-500' : 'text-text-muted hover:text-amber-500'
                }`}
              >
                {isImportant ? <Star className="w-4 h-4 fill-amber-500" /> : <StarOff className="w-4 h-4" />}
                {isImportant ? 'Marked Important' : 'Mark as Important'}
              </button>
            </div>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={3}
              className="input text-sm resize-none"
              placeholder="Add personal notes (e.g. Follow-up after 5 days, Increase fluids…)"
            />
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setResult(null); }}
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-3 justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Prescription
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STATUS_ORDER: OcrStatus[] = ['quality-check', 'preprocessing', 'ocr', 'ai', 'done'];

function isStatusComplete(check: OcrStatus, current: OcrStatus): boolean {
  return STATUS_ORDER.indexOf(check) <= STATUS_ORDER.indexOf(current);
}
