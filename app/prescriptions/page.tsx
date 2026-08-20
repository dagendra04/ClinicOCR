import { getRecentPrescriptions } from '@/actions/prescriptions';
import Link from 'next/link';
import { FileText, Star, ChevronRight, Upload } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Metadata } from 'next';
import type { Medicine } from '@/db/schema';

export const metadata: Metadata = {
  title: 'Prescriptions',
  description: 'View all digitized prescriptions in ClinicOCR.',
};

export default async function PrescriptionsPage() {
  const prescriptions = await getRecentPrescriptions(50);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All Prescriptions</h1>
          <p className="text-text-muted text-sm mt-1">{prescriptions.length} prescriptions digitized</p>
        </div>
        <Link href="/upload" className="btn-primary">
          <Upload className="w-4 h-4" />
          Upload Prescription
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-primary font-semibold mb-2">No prescriptions yet</p>
          <p className="text-text-muted text-sm mb-5">Upload your first prescription to get started.</p>
          <Link href="/upload" className="btn-primary mx-auto w-fit">
            <Upload className="w-4 h-4" />
            Upload Now
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {prescriptions.map(({ prescription: rx, patient }) => {
              const medicines = (rx.medicinesJson as Medicine[]) ?? [];
              const tags      = (rx.tags as string[]) ?? [];
              return (
                <Link
                  key={rx.id}
                  href={`/prescriptions/${rx.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-surface-muted/50 transition-colors group"
                >
                  {/* Image thumbnail */}
                  <div className="w-10 h-12 rounded-lg bg-slate-50 border border-surface-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {rx.imageBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/png;base64,${rx.imageBase64}`}
                        alt="Rx"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-semibold text-text-primary text-sm">{patient?.name ?? 'Unknown'}</p>
                      {rx.important && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    {rx.aiSummary && (
                      <p className="text-xs text-text-muted line-clamp-1 mb-1">{rx.aiSummary}</p>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {medicines.slice(0, 2).map((m) => (
                        <span key={m.name} className="badge-blue text-[10px]">{m.name}</span>
                      ))}
                      {tags.slice(0, 2).map((t) => (
                        <span key={t} className="badge-gray text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-text-muted flex-shrink-0 hidden sm:block">
                    {formatDateTime(rx.createdAt)}
                  </p>

                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
