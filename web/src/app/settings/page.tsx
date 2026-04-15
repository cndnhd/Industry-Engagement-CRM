'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchLookup, addLookupValue, deleteLookupValue } from '@/lib/api';
import type { LookupItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';

const LOOKUP_KEYS = [
  'departments',
  'facultyTitles',
  'contractorRoles',
  'functionalAreas',
  'influenceLevels',
  'riskToleranceLevels',
  'personalOrientations',
  'orgTypes',
  'ownershipTypes',
  'growthStages',
  'priorityLevels',
  'relationshipLevels',
  'outreachMotions',
  'engagementTypes',
  'journeyStages',
  'opportunityTypes',
  'opportunityStages',
  'opportunityStatuses',
  'governmentAlignmentTypes',
  'strategicTags',
  'linkageRoles',
] as const;

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}

type LookupData = { key: string; label: string; items: LookupItem[] };

export default function SettingsPage() {
  const [lookups, setLookups] = useState<LookupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all(
      LOOKUP_KEYS.map(key =>
        fetchLookup(key)
          .then(items => ({ key, label: formatLabel(key), items }))
          .catch(() => ({ key, label: formatLabel(key), items: [] as LookupItem[] }))
      )
    )
      .then(results => setLookups(results))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function toggle(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleAdd(key: string) {
    const name = (newValues[key] ?? '').trim();
    if (!name) return;

    setSaving(p => ({ ...p, [key]: true }));
    try {
      const created = await addLookupValue(key, name);
      setLookups(prev =>
        prev.map(lu =>
          lu.key === key
            ? { ...lu, items: [...lu.items, created].sort((a, b) => a.name.localeCompare(b.name)) }
            : lu
        )
      );
      setNewValues(p => ({ ...p, [key]: '' }));
      setToast({ message: `Added "${created.name}" to ${formatLabel(key)}`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to add', type: 'error' });
    } finally {
      setSaving(p => ({ ...p, [key]: false }));
    }
  }

  async function handleDelete(key: string, item: LookupItem) {
    if (!confirm(`Delete "${item.name}" from ${formatLabel(key)}?\n\nThis will fail if the value is referenced by other records.`)) return;

    try {
      await deleteLookupValue(key, item.id);
      setLookups(prev =>
        prev.map(lu =>
          lu.key === key
            ? { ...lu, items: lu.items.filter(i => i.id !== item.id) }
            : lu
        )
      );
      setToast({ message: `Removed "${item.name}"`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete', type: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings — Lookup Tables" />
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading lookup tables…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings — Lookup Tables" subtitle="Add, view, and manage dropdown values used across the CRM" />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {lookups.length} lookup tables &middot;{' '}
          <span className="font-semibold text-gray-700">{lookups.reduce((n, l) => n + l.items.length, 0)}</span>{' '}
          total values
        </p>
        <button
          onClick={loadAll}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Refresh All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lookups.map(lu => {
          const isOpen = expanded.has(lu.key);
          const isSaving = saving[lu.key] ?? false;
          return (
            <div key={lu.key} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
              {/* Header row — click to expand */}
              <button
                onClick={() => toggle(lu.key)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{lu.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {lu.items.length} {lu.items.length === 1 ? 'value' : 'values'}
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100">
                  {/* Add new value form */}
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
                    <input
                      type="text"
                      value={newValues[lu.key] ?? ''}
                      onChange={e => setNewValues(p => ({ ...p, [lu.key]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(lu.key); }}
                      placeholder={`Add new ${lu.label.toLowerCase()}…`}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={isSaving}
                    />
                    <button
                      onClick={() => handleAdd(lu.key)}
                      disabled={isSaving || !(newValues[lu.key] ?? '').trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '…' : 'Add'}
                    </button>
                  </div>

                  {/* Value list */}
                  <div className="px-5 py-2">
                    {lu.items.length === 0 ? (
                      <p className="py-3 text-center text-xs text-gray-400">No values yet — add one above</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {lu.items.map(item => (
                          <li key={item.id} className="group flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-800">{item.name}</span>
                              <span className="text-[10px] text-gray-400">#{item.id}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(lu.key, item)}
                              className="rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                              title={`Delete "${item.name}"`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
