import { getPatientById } from '@/actions/patients';
import { getPrescriptionsByPatient } from '@/actions/prescriptions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, User, Phone, Calendar, Upload,
  FileText, Star, Edit, Trash2,
} from 'lucide-react';
import { formatDate, formatDateTime, getInitials } from '@/lib/utils';
import DeletePatientButton from '@/components/forms/DeletePatientButton';
import type { Metadata } from 'next';
import type { Prescription } from '@/db/schema';

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PatientDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await getPatientById(id);
  return {
    title: patient ? patient.name : 'Patient Detail',
    description: patient ? `Prescription history for ${patient.name}` : undefined,
  };
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const [patient, prescriptions] = await Promise.all([
    getPatientById(id),
    getPrescriptionsByPatient(id),
  ]);

  if (!patient) notFound();

  const importantRx = prescriptions.filter((rx) => rx.important);
  const regularRx   = prescriptions.filter((rx) => !rx.important);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/patients" className="btn-ghost mb-5 -ml-1 inline-flex">
        <ChevronLeft className="w-4 h-4" />
        Patients
      </Link>

      {/* Patient header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center">
              {getInitials(patient.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{patient.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                {patient.age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {patient.age} years
                  </span>
                )}
                {patient.gender && <span>{patient.gender}</span>}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Registered {formatDate(patient.createdAt)} · {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/patients/${id}/upload`} className="btn-primary">
              <Upload className="w-4 h-4" />
              Upload Rx
            </Link>
            <Link href={`/patients/${id}/edit`} className="btn-secondary">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <DeletePatientButton id={id} name={patient.name} />
          </div>
        </div>
      </div>

      {/* Prescriptions */}
      {prescriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-primary font-semibold mb-1">No prescriptions yet</p>
          <p className="text-text-muted text-sm mb-5">Upload the first prescription for this patient.</p>
          <Link href={`/patients/${id}/upload`} className="btn-primary mx-auto w-fit">
            <Upload className="w-4 h-4" />
            Upload First Prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Important prescriptions */}
          {importantRx.length > 0 && (
            <div>
              <h2 className="section-title flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Important Records
              </h2>
              <div className="space-y-3">
                {importantRx.map((rx) => (
                  <PrescriptionRow key={rx.id} rx={rx} patientId={id} />
                ))}
              </div>
            </div>
          )}

          {/* Regular prescriptions */}
          <div>
            <h2 className="section-title flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-brand-500" />
              Prescription History
            </h2>
            <div className="space-y-3">
              {regularRx.map((rx) => (
                <PrescriptionRow key={rx.id} rx={rx} patientId={id} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionRow({ rx, patientId }: { rx: Prescription; patientId: string }) {
  const tags = (rx.tags as string[]) ?? [];
  const medicines = (rx.medicinesJson as Array<{ name: string }>) ?? [];

  return (
    <Link
      href={`/prescriptions/${rx.id}`}
      className="card card-hover flex items-center gap-4 p-4 group"
    >
      {/* Image */}
      <div className="w-12 h-14 rounded-lg bg-slate-50 border border-surface-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        {rx.imageBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${rx.imageBase64}`}
            alt="Prescription thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="w-5 h-5 text-slate-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-text-primary text-sm">
            {formatDateTime(rx.createdAt)}
          </p>
          {rx.important && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          )}
        </div>
        {rx.aiSummary && (
          <p className="text-xs text-text-muted mb-2 line-clamp-1">{rx.aiSummary}</p>
        )}
        <div className="flex gap-1 flex-wrap">
          {medicines.slice(0, 3).map((m) => (
            <span key={m.name} className="badge-blue text-[10px]">{m.name}</span>
          ))}
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="badge-gray text-[10px]">{tag}</span>
          ))}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors flex-shrink-0" />
    </Link>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
