'use client';

import { useState, useEffect } from 'react';
import { fetchTagsSummary } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import type { BadgeColor } from '@/components/ui/Badge';

type TagSummary = { id: number; name: string; orgCount: number };

const TAG_COLORS: BadgeColor[] = ['indigo', 'emerald', 'amber', 'blue', 'purple', 'rose', 'cyan'];

export default function TagsPage() {
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<TagSummary | null>(null);

  useEffect(() => {
    fetchTagsSummary()
      .then(data => setTags(data))
      .catch(e => console.error('Failed to load tags', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Strategic Tags" />
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading tags…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Strategic Tags" />

      {tags.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5 text-center text-sm text-gray-400">
          No strategic tags found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag, idx) => {
            const color = TAG_COLORS[idx % TAG_COLORS.length];
            const isSelected = selectedTag?.id === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`text-left rounded-xl p-5 shadow-sm ring-1 transition-all ${
                  isSelected
                    ? `ring-2 ${ringColor(color)} ${bgActive(color)}`
                    : 'ring-gray-950/5 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${dotBg(color)}`}>
                    <svg className={`h-4 w-4 ${dotText(color)}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                  </div>
                  <span className={`text-2xl font-bold ${numColor(color)}`}>{tag.orgCount}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{tag.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {tag.orgCount === 1 ? '1 organization' : `${tag.orgCount} organizations`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedTag && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h3 className="text-base font-semibold text-gray-900">{selectedTag.name}</h3>
          <p className="mt-2 text-sm text-gray-600">
            This tag is applied to <span className="font-semibold">{selectedTag.orgCount}</span> organization{selectedTag.orgCount !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}

const COLOR_MAP: Record<string, { dot: string; dotText: string; ring: string; bg: string; num: string }> = {
  indigo:  { dot: 'bg-indigo-100',  dotText: 'text-indigo-600',  ring: 'ring-indigo-400',  bg: 'bg-indigo-50',  num: 'text-indigo-600' },
  emerald: { dot: 'bg-emerald-100', dotText: 'text-emerald-600', ring: 'ring-emerald-400', bg: 'bg-emerald-50', num: 'text-emerald-600' },
  amber:   { dot: 'bg-amber-100',   dotText: 'text-amber-600',   ring: 'ring-amber-400',   bg: 'bg-amber-50',   num: 'text-amber-600' },
  blue:    { dot: 'bg-blue-100',    dotText: 'text-blue-600',    ring: 'ring-blue-400',    bg: 'bg-blue-50',    num: 'text-blue-600' },
  purple:  { dot: 'bg-purple-100',  dotText: 'text-purple-600',  ring: 'ring-purple-400',  bg: 'bg-purple-50',  num: 'text-purple-600' },
  rose:    { dot: 'bg-rose-100',    dotText: 'text-rose-600',    ring: 'ring-rose-400',    bg: 'bg-rose-50',    num: 'text-rose-600' },
  cyan:    { dot: 'bg-cyan-100',    dotText: 'text-cyan-600',    ring: 'ring-cyan-400',    bg: 'bg-cyan-50',    num: 'text-cyan-600' },
};

function dotBg(c: string) { return COLOR_MAP[c]?.dot ?? 'bg-gray-100'; }
function dotText(c: string) { return COLOR_MAP[c]?.dotText ?? 'text-gray-600'; }
function ringColor(c: string) { return COLOR_MAP[c]?.ring ?? 'ring-gray-400'; }
function bgActive(c: string) { return COLOR_MAP[c]?.bg ?? 'bg-gray-50'; }
function numColor(c: string) { return COLOR_MAP[c]?.num ?? 'text-gray-600'; }
