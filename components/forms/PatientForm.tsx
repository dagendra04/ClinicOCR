'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createPatient, updatePatient } from '@/actions/patients';
import { toast } from 'sonner';
import { User, Phone, Calendar, Loader2 } from 'lucide-react';
import type { Patient } from '@/db/schema';

interface PatientFormProps {
  patient?: Patient;
}

export default function PatientForm({ patient }: PatientFormProps) {
  const router  = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(patient);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updatePatient(patient!.id, formData)
      : await createPatient(formData);

    setLoading(false);

    if (result.success) {
      toast.success(isEdit ? 'Patient updated' : 'Patient added successfully');
      router.push(isEdit ? `/patients/${patient!.id}` : '/patients');
      router.refresh();
    } else {
      toast.error(result.error ?? 'Something went wrong');
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            name="name"
            type="text"
            required
            defaultValue={patient?.name ?? ''}
            placeholder="Enter patient's full name"
            className="input pl-10"
          />
        </div>
      </div>

      {/* Age + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Age</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              name="age"
              type="number"
              min="0"
              max="150"
              defaultValue={patient?.age ?? ''}
              placeholder="Years"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Gender</label>
          <select
            name="gender"
            defaultValue={patient?.gender ?? ''}
            className="input appearance-none"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            name="phone"
            type="tel"
            defaultValue={patient?.phone ?? ''}
            placeholder="Enter phone number"
            className="input pl-10"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEdit ? 'Saving…' : 'Adding…'}
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Add Patient'
          )}
        </button>
      </div>
    </form>
  );
}
