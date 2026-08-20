import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { FileText, Star, ChevronRight } from 'lucide-react';
import type { Prescription, Patient } from '@/db/schema';

interface RecentPrescriptionCardProps {
  prescription: Prescription;
  patient:      Patient | null;
}

export default function RecentPrescriptionCard({ prescription, patient }: RecentPrescriptionCardProps) {
  const tags = (prescription.tags as string[]) ?? [];

  return (
    <Link
      href={`/prescriptions/${prescription.id}`}
      className="card card-hover flex items-center gap-4 p-4 group"
    >
      {/* Image preview or icon */}
      <div className="w-12 h-14 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {prescription.imageBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${prescription.imageBase64}`}
            alt="Prescription"
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="w-5 h-5 text-brand-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-text-primary text-sm truncate">
            {patient?.name ?? 'Unknown Patient'}
          </p>
          {prescription.important && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-text-muted mb-1.5">
          {formatDateTime(prescription.createdAt)}
        </p>
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-gray text-[10px]">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors flex-shrink-0" />
    </Link>
  );
}
