'use client';

import { useState } from 'react';
import type { JourneyLog } from '@/types';

type Props = {
  entries: (JourneyLog & { JourneyStageName?: string; OrganizationName?: string })[];
  onEdit?: (entry: JourneyLog) => void;
  onDelete?: (id: number) => void;
  showOrg?: boolean;
};

export default function JourneyTimeline({ entries, onEdit, onDelete, showOrg = false }: Props) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
        <p className="text-sm text-gray-500">No activity entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div key={entry.JourneyLogID} className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {entry.JourneyStageName && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {entry.JourneyStageName}
                  </span>
                )}
                {entry.EventType && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {entry.EventType}
                  </span>
                )}
                {entry.LogDate && (
                  <span className="text-xs text-gray-500">
                    {new Date(entry.LogDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {showOrg && entry.OrganizationName && (
                <p className="mt-1 text-sm font-medium text-gray-900">{entry.OrganizationName}</p>
              )}
              {entry.Outcome && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Outcome:</span> {entry.Outcome}</p>}
              {entry.NextStep && <p className="mt-0.5 text-sm text-gray-700"><span className="font-medium">Next Step:</span> {entry.NextStep}</p>}
              {entry.Notes && <p className="mt-1 text-sm text-gray-600">{entry.Notes}</p>}
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                {entry.Owner && <span>Owner: {entry.Owner}</span>}
                {entry.NextStepDate && <span>Follow-up: {new Date(entry.NextStepDate).toLocaleDateString()}</span>}
              </div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex flex-shrink-0 items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  confirmId === entry.JourneyLogID ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { onDelete(entry.JourneyLogID); setConfirmId(null); }}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(entry.JourneyLogID)}
                      className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
