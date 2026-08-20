import { getPrescriptionById } from '@/actions/prescriptions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Star, FileText, Pill,
  AlertCircle, Tag, FileSearch,
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import DoctorNotesPanel from '@/components/prescription/DoctorNotesPanel';
import PdfExportButton from '@/components/prescription/PdfExportButton';
import { classifyOcrQuality } from '@/lib/ocr/tesseract';
import type { Metadata } from 'next';
import type { Medicine } from '@/db/schema';

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PrescriptionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPrescriptionById(id);
  return {
    title: data?.patient ? `Prescription — ${data.patient.name}` : 'Prescription Detail',
    description: data?.prescription.aiSummary ?? undefined,
  };
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { id } = await params;
  const data = await getPrescriptionById(id);

  if (!data) notFound();

  const { prescription: rx, patient } = data;
  const medicines  = (rx.medicinesJson  as Medicine[]) ?? [];
  const tags       = (rx.tags           as string[])   ?? [];
  const findings   = (rx.importantFindings as string[]) ?? [];
  const confidence = rx.ocrConfidence ?? 0;
  const qualityLabel = classifyOcrQuality(confidence);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link href={patient ? `/patients/${patient.id}` : '/prescriptions'} className="btn-ghost mb-5 -ml-1 inline-flex">
        <ChevronLeft className="w-4 h-4" />
        {patient?.name ?? 'Back'}
      </Link>

      {/* Header */}
      <div className="card p-5 mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-text-primary">Prescription Detail</h1>
            {rx.important && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <p className="text-sm text-text-muted">
            {patient?.name} · {formatDateTime(rx.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patient && <PdfExportButton prescription={rx} patient={patient} />}
        </div>
      </div>

      {/* OCR Confidence badge */}
      <div className="flex items-center gap-3 mb-5">
        <FileSearch className="w-4 h-4 text-brand-500" />
        <span className="text-sm text-text-muted">OCR Confidence:</span>
        <span className={`badge ${
          qualityLabel.label === 'Excellent' ? 'badge-green' :
          qualityLabel.label === 'Good'      ? 'badge-yellow' : 'badge-red'
        }`}>
          {qualityLabel.label}
        </span>
        <span className="text-sm font-semibold text-text-primary">{confidence}%</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image + Raw OCR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original image */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Original Prescription</p>
              {rx.imageBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${rx.imageBase64}`}
                  alt="Original prescription"
                  className="w-full rounded-xl border border-surface-border object-contain max-h-64 bg-slate-50"
                />
              ) : (
                <div className="h-40 rounded-xl bg-slate-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>

            {/* Raw OCR */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Raw OCR Output</p>
              <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto">
                {rx.rawOcr || 'No raw OCR data'}
              </pre>
            </div>
          </div>

          {/* AI Summary */}
          {rx.aiSummary && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center">
                  <span className="text-brand-600 text-xs font-bold">AI</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">AI Summary</p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{rx.aiSummary}</p>
            </div>
          )}

          {/* Corrected Text */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-text-primary mb-3">Corrected Prescription Text</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-surface-border">
              <pre className="prescription-text">{rx.correctedText || 'No corrected text available'}</pre>
            </div>
          </div>

          {/* Medicines */}
          {medicines.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4 text-brand-500" />
                Medicines ({medicines.length})
              </h3>
              <div className="space-y-0 divide-y divide-surface-border">
                {medicines.map((med, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <span className={`badge flex-shrink-0 ${
                      med.name.startsWith('Possibly') ? 'badge-yellow' : 'badge-blue'
                    }`}>
                      {med.name}
                    </span>
                    {med.dosage && (
                      <span className="text-sm text-text-secondary">{med.dosage}</span>
                    )}
                    {med.frequency && (
                      <span className="text-xs text-text-muted ml-auto">{med.frequency}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Findings */}
          {findings.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Important Findings
              </h3>
              <ul className="space-y-2">
                {findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Patient info */}
          {patient && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">Patient</p>
              <p className="font-semibold text-text-primary">{patient.name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {[patient.age ? `${patient.age}y` : null, patient.gender].filter(Boolean).join(' · ')}
              </p>
              {patient.phone && <p className="text-xs text-text-muted">{patient.phone}</p>}
              <Link
                href={`/patients/${patient.id}`}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block"
              >
                View all prescriptions →
              </Link>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-3">
                <Tag className="w-4 h-4 text-brand-500" />
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="badge-blue">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes Panel */}
          <DoctorNotesPanel
            prescriptionId={rx.id}
            initialNotes={rx.doctorNotes}
            initialImportant={rx.important ?? false}
          />
        </div>
      </div>
    </div>
  );
}
