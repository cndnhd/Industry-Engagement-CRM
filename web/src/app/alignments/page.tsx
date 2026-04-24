'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchAlignmentsSummary,
  fetchAlignmentOrganizations,
  addAlignmentOrganization,
  removeAlignmentOrganization,
  fetchOrganizations,
} from '@/lib/api';
import type { Organization } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';

type AlignmentSummary = { id: number; name: string; orgCount: number };
type AlignmentOrg = { OrganizationID: number; OrganizationName: string; City?: string; State?: string; EngagementStatus?: string; AssignedOwner?: string };

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

  const [alignOrgs, setAlignOrgs] = useState<AlignmentOrg[]>([]);
  const [alignOrgsLoading, setAlignOrgsLoading] = useState(false);

  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadAlignments = useCallback(async () => {
    try {
      const data = await fetchAlignmentsSummary();
      setAlignments(data);
    } catch (e) {
      console.error('Failed to load alignments', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlignments(); }, [loadAlignments]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSelectAlignment(a: AlignmentSummary) {
    if (selected?.id === a.id) {
      setSelected(null);
      setAlignOrgs([]);
      setShowAddOrg(false);
      return;
    }
    setSelected(a);
    setShowAddOrg(false);
    setAlignOrgsLoading(true);
    try {
      const orgs = await fetchAlignmentOrganizations(a.id);
      setAlignOrgs(orgs);
    } catch {
      setAlignOrgs([]);
    }
    setAlignOrgsLoading(false);
  }

  async function openAddOrg() {
    setShowAddOrg(true);
    setOrgSearch('');
    if (allOrgs.length === 0) {
      try {
        const orgs = await fetchOrganizations();
        setAllOrgs(orgs);
      } catch { /* ignore */ }
    }
  }

  const assignedOrgIds = new Set(alignOrgs.map(o => o.OrganizationID));
  const filteredOrgs = allOrgs
    .filter(o => !assignedOrgIds.has(o.OrganizationID))
    .filter(o => !orgSearch || o.OrganizationName.toLowerCase().includes(orgSearch.toLowerCase()));

  async function handleAddOrg(orgId: number) {
    if (!selected) return;
    setSaving(true);
    try {
      await addAlignmentOrganization(selected.id, orgId);
      const orgs = await fetchAlignmentOrganizations(selected.id);
      setAlignOrgs(orgs);
      await loadAlignments();
      setSelected(prev => prev ? { ...prev, orgCount: orgs.length } : prev);
      setToast('Organization added to alignment');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to add');
    }
    setSaving(false);
  }

  async function handleRemoveOrg(orgId: number) {
    if (!selected) return;
    setSaving(true);
    try {
      await removeAlignmentOrganization(selected.id, orgId);
      const orgs = await fetchAlignmentOrganizations(selected.id);
      setAlignOrgs(orgs);
      await loadAlignments();
      setSelected(prev => prev ? { ...prev, orgCount: orgs.length } : prev);
      setToast('Organization removed from alignment');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to remove');
    }
    setSaving(false);
  }

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

      {toast && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 ring-1 ring-blue-200">
          {toast}
        </div>
      )}

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
                onClick={() => handleSelectAlignment(a)}
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
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
              <p className="text-sm text-gray-500">
                {selected.orgCount} organization{selected.orgCount !== 1 ? 's' : ''} aligned
              </p>
            </div>
            <button
              onClick={openAddOrg}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Organization
            </button>
          </div>

          {showAddOrg && (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
              <input
                type="text"
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                placeholder="Search organizations…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
                {filteredOrgs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    {orgSearch ? 'No matching organizations found.' : 'All organizations are already aligned.'}
                  </p>
                ) : (
                  filteredOrgs.slice(0, 20).map(o => (
                    <button
                      key={o.OrganizationID}
                      onClick={() => handleAddOrg(o.OrganizationID)}
                      disabled={saving}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left hover:bg-blue-50 disabled:opacity-50"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{o.OrganizationName}</span>
                        {(o.City || o.State) && (
                          <span className="ml-2 text-xs text-gray-400">{[o.City, o.State].filter(Boolean).join(', ')}</span>
                        )}
                      </div>
                      <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="px-6 py-4">
            {alignOrgsLoading ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading organizations…</div>
            ) : alignOrgs.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">No organizations assigned to this alignment yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-2">Organization</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {alignOrgs.map(o => (
                    <tr key={o.OrganizationID} className="hover:bg-gray-50">
                      <td className="py-2.5">
                        <Link href={`/organizations/${o.OrganizationID}`} className="font-medium text-blue-600 hover:text-blue-800">
                          {o.OrganizationName}
                        </Link>
                      </td>
                      <td className="py-2.5 text-gray-500">{[o.City, o.State].filter(Boolean).join(', ') || '—'}</td>
                      <td className="py-2.5">
                        {o.EngagementStatus ? <Badge label={o.EngagementStatus} color={o.EngagementStatus === 'Active' ? 'emerald' : 'slate'} size="sm" /> : '—'}
                      </td>
                      <td className="py-2.5 text-gray-500">{o.AssignedOwner || '—'}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleRemoveOrg(o.OrganizationID)}
                          disabled={saving}
                          className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Remove from alignment"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
