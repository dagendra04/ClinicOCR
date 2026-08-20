'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, UserPlus, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { Patient } from '@/db/schema';

interface SelectPatientProps {
  patients: Patient[];
}

export default function SelectPatient({ patients }: SelectPatientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? '').includes(search)
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search patient by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm mb-3">
            {search ? `No patients found for "${search}"` : 'No patients registered yet'}
          </p>
          <Link href="/patients/new" className="btn-primary mx-auto w-fit">
            <UserPlus className="w-4 h-4" />
            Add New Patient
          </Link>
        </div>
      ) : (
        <div className="space-y-2 max-h-[450px] overflow-y-auto">
          {filtered.map((patient) => (
            <button
              key={patient.id}
              onClick={() => router.push(`/patients/${patient.id}/upload`)}
              className="w-full card card-hover flex items-center gap-3 p-3.5 text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                {getInitials(patient.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm">{patient.name}</p>
                <p className="text-xs text-text-muted">
                  {[patient.age ? `${patient.age}y` : null, patient.gender, patient.phone]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
