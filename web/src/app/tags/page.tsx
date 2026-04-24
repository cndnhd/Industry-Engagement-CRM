'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchTagsSummary, fetchTagOrganizations, addTagOrganization, removeTagOrganization, fetchOrganizations } from '@/lib/api';
import type { Organization } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { type BadgeColor } from '@/components/ui/Badge';

type TagSummary = { id: number; name: string; orgCount: number };
type TagOrg = { OrganizationID: number; OrganizationName: string; City?: string; State?: string; EngagementStatus?: string; AssignedOwner?: string };

const TAG_COLORS: BadgeColor[] = ['indigo', 'emerald', 'amber', 'blue', 'purple', 'rose', 'cyan'];

export default function TagsPage() {
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<TagSummary | null>(null);

  const [tagOrgs, setTagOrgs] = useState<TagOrg[]>([]);
  const [tagOrgsLoading, setTagOrgsLoading] = useState(false);

  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      const data = await fetchTagsSummary();
      setTags(data);
    } catch (e) {
      console.error('Failed to load tags', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSelectTag(tag: TagSummary) {
    if (selectedTag?.id === tag.id) {
      setSelectedTag(null);
      setTagOrgs([]);
      setShowAddOrg(false);
      return;
    }
    setSelectedTag(tag);
    setShowAddOrg(false);
    setTagOrgsLoading(true);
    try {
      const orgs = await fetchTagOrganizations(tag.id);
      setTagOrgs(orgs);
    } catch {
      setTagOrgs([]);
    }
    setTagOrgsLoading(false);
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

  const assignedOrgIds = new Set(tagOrgs.map(o => o.OrganizationID));
  const filteredOrgs = allOrgs
    .filter(o => !assignedOrgIds.has(o.OrganizationID))
    .filter(o => !orgSearch || o.OrganizationName.toLowerCase().includes(orgSearch.toLowerCase()));

  async function handleAddOrg(orgId: number) {
    if (!selectedTag) return;
    setSaving(true);
    try {
      await addTagOrganization(selectedTag.id, orgId);
      const orgs = await fetchTagOrganizations(selectedTag.id);
      setTagOrgs(orgs);
      await loadTags();
      setSelectedTag(prev => prev ? { ...prev, orgCount: orgs.length } : prev);
      setToast('Organization added to tag');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to add');
    }
    setSaving(false);
  }

  async function handleRemoveOrg(orgId: number) {
    if (!selectedTag) return;
    setSaving(true);
    try {
      await removeTagOrganization(selectedTag.id, orgId);
      const orgs = await fetchTagOrganizations(selectedTag.id);
      setTagOrgs(orgs);
      await loadTags();
      setSelectedTag(prev => prev ? { ...prev, orgCount: orgs.length } : prev);
      setToast('Organization removed from tag');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to remove');
    }
    setSaving(false);
  }

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

      {toast && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 ring-1 ring-blue-200">
          {toast}
        </div>
      )}

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
                onClick={() => handleSelectTag(tag)}
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
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selectedTag.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedTag.orgCount} organization{selectedTag.orgCount !== 1 ? 's' : ''} tagged
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
                    {orgSearch ? 'No matching organizations found.' : 'All organizations are already tagged.'}
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
            {tagOrgsLoading ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading organizations…</div>
            ) : tagOrgs.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">No organizations assigned to this tag yet.</div>
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
                  {tagOrgs.map(o => (
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
                          title="Remove from tag"
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
