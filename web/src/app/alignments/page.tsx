'use client';

import { useState, useEffect } from 'react';
import { fetchAlignmentsSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';

type AlignmentSummary = { id: number; name: string; orgCount: number };

const GOV_PALETTE = ['slate', 'blue', 'indigo'] as const;
type GovColor = (typeof GOV_PALETTE)[number];

const GOV_STYLES: Record<GovColor, { dot: string; dotText: string; ring: string; bg: string; num: string }> = {
  slate:  { dot: 'bg-slate-100',  dotText: 'text-slate-600',  ring: 'ring-slate-400',  bg: 'bg-slate-50',  num: 'text-slate-600' },
  blue:   { dot: 'bg-blue-100',   dotText: 'text-blue-600',   ring: 'ring-blue-400',   bg: 'bg-blue-50',   num: 'text-blue-600' },
  indigo: { dot: 'bg-indigo-100', dotText: 'text-indigo-600', ring: 'ring-indigo-400', bg: 'bg-indigo-50', num: 'text-indigo-600' },
};

function govColor(idx: number): GovColor {
  return GOV_PALETTE[idx % GOV_PALETTE.length];
}

export default function AlignmentsPage() {
  const [alignments, setAlignments] = useState<AlignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AlignmentSummary | null>(null);

  useEffect(() => {
    fetchAlignmentsSummary()
      .then(data => setAlignments(data))
      .catch(e => console.error('Failed to load alignments', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Government Alignments" />
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading alignments…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Government Alignments" />

      {alignments.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5 text-center text-sm text-gray-400">
          No government alignments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {alignments.map((a, idx) => {
            const c = govColor(idx);
            const styles = GOV_STYLES[c];
            const isSelected = selected?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(isSelected ? null : a)}
                className={`text-left rounded-xl p-5 shadow-sm ring-1 transition-all ${
                  isSelected
                    ? `ring-2 ${styles.ring} ${styles.bg}`
                    : 'ring-gray-950/5 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${styles.dot}`}>
                    <svg className={`h-4 w-4 ${styles.dotText}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                  </div>
                  <span className={`text-2xl font-bold ${styles.num}`}>{a.orgCount}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{a.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {a.orgCount === 1 ? '1 organization' : `${a.orgCount} organizations`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
              <p className="mt-0.5 text-sm text-gray-600">
                This alignment is applied to <span className="font-semibold">{selected.orgCount}</span> organization{selected.orgCount !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
