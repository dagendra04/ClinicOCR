'use client';

import { useState } from 'react';
import { updatePrescriptionMeta } from '@/actions/prescriptions';
import { toast } from 'sonner';
import { Star, StarOff, Save, Loader2 } from 'lucide-react';

interface DoctorNotesPanelProps {
  prescriptionId: string;
  initialNotes:   string | null;
  initialImportant: boolean;
}

export default function DoctorNotesPanel({ prescriptionId, initialNotes, initialImportant }: DoctorNotesPanelProps) {
  const [notes,     setNotes]     = useState(initialNotes ?? '');
  const [important, setImportant] = useState(initialImportant);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updatePrescriptionMeta(prescriptionId, { doctorNotes: notes, important });
    setSaving(false);
    if (result.success) {
      toast.success('Notes saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error(result.error ?? 'Save failed');
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Doctor Notes</h3>
        <button
          onClick={async () => {
            const newVal = !important;
            setImportant(newVal);
            await updatePrescriptionMeta(prescriptionId, { important: newVal });
            toast.success(newVal ? 'Marked as important' : 'Removed from important');
          }}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            important ? 'text-amber-500' : 'text-text-muted hover:text-amber-500'
          }`}
        >
          {important
            ? <Star className="w-4 h-4 fill-amber-500" />
            : <StarOff className="w-4 h-4" />
          }
          {important ? 'Important' : 'Mark Important'}
        </button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="input text-sm resize-none mb-3"
        placeholder="Add notes (e.g. Follow-up after 5 days, Increase fluids…)"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary text-sm"
      >
        {saving ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
        ) : saved ? (
          <><Save className="w-3.5 h-3.5" /> Saved!</>
        ) : (
          <><Save className="w-3.5 h-3.5" /> Save Notes</>
        )}
      </button>
    </div>
  );
}
