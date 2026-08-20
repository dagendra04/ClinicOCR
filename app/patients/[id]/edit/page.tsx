import { getPatientById } from '@/actions/patients';
import PatientForm from '@/components/forms/PatientForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';
import type { Metadata } from 'next';

interface EditPatientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPatientPageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await getPatientById(id);
  return {
    title: patient ? `Edit ${patient.name}` : 'Edit Patient',
  };
}

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/patients/${id}`} className="btn-ghost mb-5 -ml-1 inline-flex">
        <ChevronLeft className="w-4 h-4" />
        {patient.name}
      </Link>

      <div className="card p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Edit Patient</h1>
            <p className="text-sm text-text-muted">Update patient information</p>
          </div>
        </div>
        <PatientForm patient={patient} />
      </div>
    </div>
  );
}
