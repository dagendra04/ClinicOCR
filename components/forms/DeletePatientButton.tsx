'use client';

import { useState } from 'react';
import { deletePatient } from '@/actions/patients';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeletePatientButtonProps {
  id:   string;
  name: string;
}

export default function DeletePatientButton({ id, name }: DeletePatientButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const result = await deletePatient(id);
    setLoading(false);
    setConfirming(false);

    if (result.success) {
      toast.success(`Patient "${name}" deleted`);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Delete failed');
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 font-medium">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-ghost text-xs py-1.5 px-2.5 text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
