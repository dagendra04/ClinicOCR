import { getPatients } from '@/actions/patients';
import Link from 'next/link';
import { Users, UserPlus, Search, Phone, ChevronRight } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import DeletePatientButton from '@/components/forms/DeletePatientButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patients',
  description: 'View and manage all registered patients in ClinicOCR.',
};

interface PatientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const { q } = await searchParams;
  const patients = await getPatients(q);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Patients</h1>
          <p className="text-text-muted text-sm mt-1">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link href="/patients/new" className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Add Patient
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="GET" className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or phone number…"
            className="input pl-10 max-w-md"
          />
        </form>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-semibold mb-1">
            {q ? 'No patients found' : 'No patients yet'}
          </p>
          <p className="text-text-muted text-sm mb-5">
            {q ? `No results for "${q}"` : 'Start by adding your first patient.'}
          </p>
          {!q && (
            <Link href="/patients/new" className="btn-primary mx-auto w-fit">
              <UserPlus className="w-4 h-4" />
              Add First Patient
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-muted/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {getInitials(patient.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary text-sm">{patient.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {patient.age && (
                      <span className="text-xs text-text-muted">{patient.age} years</span>
                    )}
                    {patient.gender && (
                      <span className="text-xs text-text-muted">{patient.gender}</span>
                    )}
                    {patient.phone && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Registered date */}
                <p className="text-xs text-text-muted hidden sm:block">
                  Added {formatDate(patient.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/patients/${patient.id}/upload`}
                    className="btn-ghost text-xs py-1.5 px-2.5"
                  >
                    Upload Rx
                  </Link>
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className="btn-ghost text-xs py-1.5 px-2.5"
                  >
                    Edit
                  </Link>
                  <DeletePatientButton id={patient.id} name={patient.name} />
                </div>

                <Link
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm font-medium flex-shrink-0"
                >
                  <span className="hidden sm:inline">View</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
