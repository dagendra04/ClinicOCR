import PatientForm from '@/components/forms/PatientForm';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Patient',
  description: 'Register a new patient in ClinicOCR.',
};

export default function NewPatientPage() {
  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/patients" className="btn-ghost mb-5 -ml-1 inline-flex">
        <ChevronLeft className="w-4 h-4" />
        Patients
      </Link>

      {/* Card */}
      <div className="card p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Add New Patient</h1>
            <p className="text-sm text-text-muted">Register patient information</p>
          </div>
        </div>
        <PatientForm />
      </div>
    </div>
  );
}
