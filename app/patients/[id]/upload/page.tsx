import { getPatientById } from '@/actions/patients';
import { getPatients } from '@/actions/patients';
import UploadPrescriptionForm from '@/components/upload/UploadPrescriptionForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Upload } from 'lucide-react';
import type { Metadata } from 'next';

interface UploadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UploadPageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await getPatientById(id);
  return {
    title: patient ? `Upload Prescription — ${patient.name}` : 'Upload Prescription',
  };
}

export default async function UploadPage({ params }: UploadPageProps) {
  const { id } = await params;
  const [patient, allPatients] = await Promise.all([
    getPatientById(id),
    getPatients(),
  ]);

  if (!patient) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link href={`/patients/${id}`} className="btn-ghost mb-5 -ml-1 inline-flex">
        <ChevronLeft className="w-4 h-4" />
        {patient.name}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Upload className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Upload Prescription</h1>
          <p className="text-sm text-text-muted">Patient: <span className="font-medium text-text-primary">{patient.name}</span></p>
        </div>
      </div>

      <UploadPrescriptionForm patient={patient} allPatients={allPatients} />
    </div>
  );
}
