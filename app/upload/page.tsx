import { getPatients } from '@/actions/patients';
import SelectPatient from '@/components/upload/SelectPatient';
import Link from 'next/link';
import { Upload, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Prescription',
  description: 'Upload a prescription image and digitize it using AI-powered OCR.',
};

export default async function UploadLandingPage() {
  const patients = await getPatients();

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Upload className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Upload Prescription</h1>
          <p className="text-sm text-text-muted">Select a patient to upload a prescription for</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Select Patient</h2>
          <Link href="/patients/new" className="btn-ghost text-sm">
            <UserPlus className="w-4 h-4" />
            New Patient
          </Link>
        </div>
        <SelectPatient patients={patients} />
      </div>
    </div>
  );
}
