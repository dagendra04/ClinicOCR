import { searchPrescriptions } from '@/actions/prescriptions';
import Link from 'next/link';
import { Search, FileText, Star, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';
import type { Medicine } from '@/db/schema';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search prescriptions by patient name, phone, medicine name, or date.',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const results = q ? await searchPrescriptions(q) : [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Search</h1>
        <p className="text-text-muted text-sm mt-1">
          Find prescriptions by patient name, phone, medicine, or tag
        </p>
      </div>

      {/* Search bar */}
      <form method="GET" className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by patient name, phone number, medicine name, tag, or text…"
            className="input pl-12 py-3 text-base"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {q && (
        <div>
          <p className="text-sm text-text-muted mb-4">
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
              : `No results found for "${q}"`
            }
          </p>

          {results.length === 0 ? (
            <div className="card p-12 text-center">
              <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-primary font-semibold">No matches found</p>
              <p className="text-text-muted text-sm mt-1">
                Try different keywords — patient name, phone, medicine, or tag
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-surface-border">
                {results.map(({ prescription: rx, patient }) => {
                  const medicines = (rx.medicinesJson as Medicine[]) ?? [];
                  const tags      = (rx.tags as string[]) ?? [];
                  return (
                    <Link
                      key={rx.id}
                      href={`/prescriptions/${rx.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-muted/50 transition-colors group"
                    >
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

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-semibold text-text-primary text-sm">{patient?.name ?? 'Unknown'}</p>
                          {rx.important && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          {patient?.phone && (
                            <span className="text-xs text-text-muted">{patient.phone}</span>
                          )}
                        </div>
                        {rx.aiSummary && (
                          <p className="text-xs text-text-muted line-clamp-1 mb-1">{rx.aiSummary}</p>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          {medicines.slice(0, 3).map((m) => (
                            <span key={m.name} className="badge-blue text-[10px]">{m.name}</span>
                          ))}
                          {tags.slice(0, 2).map((t) => (
                            <span key={t} className="badge-gray text-[10px]">{t}</span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-text-muted flex-shrink-0 hidden sm:block">
                        {formatDate(rx.createdAt)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!q && (
        <div className="card p-16 text-center">
          <Search className="w-12 h-12 text-brand-200 mx-auto mb-4" />
          <p className="text-text-primary font-semibold mb-2">Search Prescriptions</p>
          <p className="text-text-muted text-sm max-w-xs mx-auto">
            Search by patient name, phone number, medicine name, date, or any text from the prescription.
          </p>
        </div>
      )}
    </div>
  );
}
