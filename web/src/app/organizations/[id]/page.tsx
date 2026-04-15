'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchOrganization,
  fetchOrganizationContacts,
  fetchOrganizationEvents,
  fetchOrganizationOpportunities,
  fetchOrganizationScore,
  fetchOrganizationTags,
  fetchOrganizationAlignments,
  fetchOrganizationFacultyLinkages,
  updateOrganization,
  deleteOrganization,
  loadLookup,
  resolveName,
} from '@/lib/api';
import type { Organization, Contact, EngagementEvent, Opportunity, OrganizationScore, LookupItem } from '@/types';
import { getScoreBadge } from '@/types';
import Badge from '@/components/ui/Badge';
import ScoreBar from '@/components/ui/ScoreBar';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

type Tab = 'contacts' | 'engagements' | 'opportunities' | 'faculty' | 'score' | 'tags' | 'alignments';

const TABS: { key: Tab; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'engagements', label: 'Engagements' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'faculty', label: 'Faculty Linkages' },
  { key: 'score', label: 'Score' },
  { key: 'tags', label: 'Tags' },
  { key: 'alignments', label: 'Alignments' },
];

type Lookups = Record<string, LookupItem[]>;

type TagItem = { tag: { id: number; name: string }; notes?: string };
type AlignmentItem = { alignment: { id: number; name: string }; notes?: string };

type Toast = { message: string; type: 'success' | 'error' };

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = Number(params.id);

  const [org, setOrg] = useState<Organization | null>(null);
  const [lookups, setLookups] = useState<Lookups>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const [tabData, setTabData] = useState<Record<string, unknown>>({});
  const [tabLoading, setTabLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function load() {
      try {
        const [o, ...lkResults] = await Promise.all([
          fetchOrganization(orgId),
          loadLookup('orgTypes'),
          loadLookup('ownershipTypes'),
          loadLookup('growthStages'),
          loadLookup('priorityLevels'),
          loadLookup('contractorRoles'),
          loadLookup('relationshipLevels'),
        ]);
        setOrg(o);
        const names = ['orgTypes', 'ownershipTypes', 'growthStages', 'priorityLevels', 'contractorRoles', 'relationshipLevels'];
        const lk: Lookups = {};
        names.forEach((n, i) => { lk[n] = lkResults[i]; });
        setLookups(lk);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgId]);

  const fetchTab = useCallback(async (tab: Tab) => {
    if (tabData[tab] !== undefined) return;
    setTabLoading(true);
    try {
      let data: unknown;
      switch (tab) {
        case 'contacts': data = await fetchOrganizationContacts(orgId); break;
        case 'engagements': data = await fetchOrganizationEvents(orgId); break;
        case 'opportunities': data = await fetchOrganizationOpportunities(orgId); break;
        case 'faculty': data = await fetchOrganizationFacultyLinkages(orgId); break;
        case 'score': data = await fetchOrganizationScore(orgId); break;
        case 'tags': data = await fetchOrganizationTags(orgId); break;
        case 'alignments': data = await fetchOrganizationAlignments(orgId); break;
      }
      setTabData((prev) => ({ ...prev, [tab]: data ?? null }));
    } catch {
      setTabData((prev) => ({ ...prev, [tab]: null }));
    } finally {
      setTabLoading(false);
    }
  }, [orgId, tabData]);

  useEffect(() => {
    if (!loading && org) fetchTab(activeTab);
  }, [activeTab, loading, org, fetchTab]);

  function openEditModal() {
    if (!org) return;
    setEditForm({
      OrganizationName: org.OrganizationName ?? '',
      City: org.City ?? '',
      State: org.State ?? '',
      HeadquartersLocation: org.HeadquartersLocation ?? '',
      RegionalFootprint: org.RegionalFootprint ?? '',
      OrgTypeID: org.OrgTypeID ?? '',
      OwnershipTypeID: org.OwnershipTypeID ?? '',
      GrowthStageID: org.GrowthStageID ?? '',
      PriorityLevelID: org.PriorityLevelID ?? '',
      ContractorRoleID: org.ContractorRoleID ?? '',
      RelationshipLevelID: org.RelationshipLevelID ?? '',
      FederalContractor: org.FederalContractor ?? false,
      RDIntensityPct: org.RDIntensityPct ?? '',
      EmailPattern: org.EmailPattern ?? '',
      ChampionIdentified: org.ChampionIdentified ?? false,
      ExecutiveSponsor: org.ExecutiveSponsor ?? false,
      Notes: org.Notes ?? '',
    });
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...editForm };
      ['OrgTypeID', 'OwnershipTypeID', 'GrowthStageID', 'PriorityLevelID', 'ContractorRoleID', 'RelationshipLevelID'].forEach((k) => {
        if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
        else payload[k] = Number(payload[k]);
      });
      if (payload.RDIntensityPct === '' || payload.RDIntensityPct === undefined) payload.RDIntensityPct = null;
      else payload.RDIntensityPct = Number(payload.RDIntensityPct);

      const updated = await updateOrganization(orgId, payload);
      setOrg(updated);
      setShowEdit(false);
      setToast({ message: 'Organization updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update organization', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this organization? All related contacts, events, and opportunities must be removed first.')) return;
    setSaving(true);
    try {
      await deleteOrganization(orgId);
      router.push('/organizations');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete organization');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading organization...</div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-sm">{error ?? 'Organization not found'}</div>
      </div>
    );
  }

  const priorityName = resolveName(lookups.priorityLevels ?? [], org.PriorityLevelID);
  const relationshipName = resolveName(lookups.relationshipLevels ?? [], org.RelationshipLevelID);
  const priorityColor: Record<string, React.ComponentProps<typeof Badge>['color']> = {
    High: 'red', Medium: 'amber', Low: 'slate',
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Back link */}
      <Link href="/organizations" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Organizations
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{org.OrganizationName}</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Delete Organization
        </button>
        <button
          onClick={openEditModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit
        </button>
        {priorityName !== '—' && <Badge label={priorityName} color={priorityColor[priorityName] ?? 'gray'} size="md" />}
        {relationshipName !== '—' && <Badge label={relationshipName} color="blue" size="md" />}
      </div>

      {/* Detail grid */}
      <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Organization Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <DetailField label="City" value={org.City} />
          <DetailField label="State" value={org.State} />
          <DetailField label="Headquarters Location" value={org.HeadquartersLocation} />
          <DetailField label="Regional Footprint" value={org.RegionalFootprint} />
          <DetailField label="Email Pattern" value={org.EmailPattern} />
          <DetailField label="Organization Type" value={resolveName(lookups.orgTypes ?? [], org.OrgTypeID)} />
          <DetailField label="Ownership Type" value={resolveName(lookups.ownershipTypes ?? [], org.OwnershipTypeID)} />
          <DetailField label="Growth Stage" value={resolveName(lookups.growthStages ?? [], org.GrowthStageID)} />
          <DetailField label="Contractor Role" value={resolveName(lookups.contractorRoles ?? [], org.ContractorRoleID)} />
          <DetailField label="Federal Contractor" value={org.FederalContractor ? 'Yes' : 'No'} />
          <DetailField label="R&D Intensity" value={org.RDIntensityPct != null ? `${org.RDIntensityPct}%` : undefined} />
          <DetailField label="Executive Sponsor" value={org.ExecutiveSponsor ? 'Yes' : 'No'} />
          <DetailField label="Champion Identified" value={org.ChampionIdentified != null ? (org.ChampionIdentified ? 'Yes' : 'No') : undefined} />
          <DetailField label="First Engagement" value={org.FirstEngagementDate ? new Date(org.FirstEngagementDate).toLocaleDateString() : undefined} />
          <DetailField label="Last Meaningful Engagement" value={org.LastMeaningfulEngagement ? new Date(org.LastMeaningfulEngagement).toLocaleDateString() : undefined} />
        </dl>
        {org.Notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{org.Notes}</p>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6 min-h-[200px]">
        {tabLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : (
          <TabContent tab={activeTab} data={tabData[activeTab]} />
        )}
      </div>

      {/* Edit Organization Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Organization" size="xl">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OrganizationName */}
            <div className="sm:col-span-2">
              <label htmlFor="edit-org-name" className="text-sm font-medium text-gray-700">Organization Name *</label>
              <input
                id="edit-org-name"
                required
                type="text"
                value={(editForm.OrganizationName as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, OrganizationName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="edit-city" className="text-sm font-medium text-gray-700">City</label>
              <input
                id="edit-city"
                type="text"
                value={(editForm.City as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, City: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="edit-state" className="text-sm font-medium text-gray-700">State</label>
              <input
                id="edit-state"
                type="text"
                value={(editForm.State as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, State: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* HeadquartersLocation */}
            <div>
              <label htmlFor="edit-hq-location" className="text-sm font-medium text-gray-700">Headquarters Location</label>
              <input
                id="edit-hq-location"
                type="text"
                value={(editForm.HeadquartersLocation as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, HeadquartersLocation: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* RegionalFootprint */}
            <div>
              <label htmlFor="edit-regional" className="text-sm font-medium text-gray-700">Regional Footprint</label>
              <input
                id="edit-regional"
                type="text"
                value={(editForm.RegionalFootprint as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, RegionalFootprint: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* OrgTypeID */}
            <div>
              <label htmlFor="edit-org-type" className="text-sm font-medium text-gray-700">Organization Type</label>
              <select
                id="edit-org-type"
                value={(editForm.OrgTypeID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, OrgTypeID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.orgTypes ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* OwnershipTypeID */}
            <div>
              <label htmlFor="edit-ownership" className="text-sm font-medium text-gray-700">Ownership Type</label>
              <select
                id="edit-ownership"
                value={(editForm.OwnershipTypeID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, OwnershipTypeID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.ownershipTypes ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* GrowthStageID */}
            <div>
              <label htmlFor="edit-growth" className="text-sm font-medium text-gray-700">Growth Stage</label>
              <select
                id="edit-growth"
                value={(editForm.GrowthStageID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, GrowthStageID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.growthStages ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* PriorityLevelID */}
            <div>
              <label htmlFor="edit-priority" className="text-sm font-medium text-gray-700">Priority Level</label>
              <select
                id="edit-priority"
                value={(editForm.PriorityLevelID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, PriorityLevelID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.priorityLevels ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* ContractorRoleID */}
            <div>
              <label htmlFor="edit-contractor" className="text-sm font-medium text-gray-700">Contractor Role</label>
              <select
                id="edit-contractor"
                value={(editForm.ContractorRoleID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, ContractorRoleID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.contractorRoles ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* RelationshipLevelID */}
            <div>
              <label htmlFor="edit-relationship" className="text-sm font-medium text-gray-700">Relationship Level</label>
              <select
                id="edit-relationship"
                value={(editForm.RelationshipLevelID as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, RelationshipLevelID: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Select —</option>
                {(lookups.relationshipLevels ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* EmailPattern */}
            <div>
              <label htmlFor="edit-email-pattern" className="text-sm font-medium text-gray-700">Email Pattern</label>
              <input
                id="edit-email-pattern"
                type="text"
                value={(editForm.EmailPattern as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, EmailPattern: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* RDIntensityPct */}
            <div>
              <label htmlFor="edit-rd-intensity" className="text-sm font-medium text-gray-700">R&D Intensity (%)</label>
              <input
                id="edit-rd-intensity"
                type="number"
                value={(editForm.RDIntensityPct as string | number) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, RDIntensityPct: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* FederalContractor */}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="edit-federal"
                type="checkbox"
                checked={!!editForm.FederalContractor}
                onChange={(e) => setEditForm((f) => ({ ...f, FederalContractor: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-federal" className="text-sm font-medium text-gray-700">Federal Contractor</label>
            </div>

            {/* ChampionIdentified */}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="edit-champion"
                type="checkbox"
                checked={!!editForm.ChampionIdentified}
                onChange={(e) => setEditForm((f) => ({ ...f, ChampionIdentified: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-champion" className="text-sm font-medium text-gray-700">Champion Identified</label>
            </div>

            {/* ExecutiveSponsor */}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="edit-exec-sponsor"
                type="checkbox"
                checked={!!editForm.ExecutiveSponsor}
                onChange={(e) => setEditForm((f) => ({ ...f, ExecutiveSponsor: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-exec-sponsor" className="text-sm font-medium text-gray-700">Executive Sponsor</label>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="edit-notes" className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="edit-notes"
                rows={3}
                value={(editForm.Notes as string) ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, Notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function TabContent({ tab, data }: { tab: Tab; data: unknown }) {
  switch (tab) {
    case 'contacts':   return <ContactsTab data={data as Contact[] | undefined} />;
    case 'engagements': return <EngagementsTab data={data as EngagementEvent[] | undefined} />;
    case 'opportunities': return <OpportunitiesTab data={data as Opportunity[] | undefined} />;
    case 'faculty':    return <FacultyTab data={data as Record<string, unknown>[] | undefined} />;
    case 'score':      return <ScoreTab data={data as OrganizationScore | null | undefined} />;
    case 'tags':       return <TagsTab data={data as TagItem[] | undefined} />;
    case 'alignments': return <AlignmentsTab data={data as AlignmentItem[] | undefined} />;
    default:           return null;
  }
}

function ContactsTab({ data }: { data?: Contact[] }) {
  if (!data || data.length === 0) return <EmptyState title="No contacts for this organization." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Primary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((c) => (
            <tr key={c.ContactID} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.FirstName} {c.LastName}</td>
              <td className="px-4 py-3 text-gray-700">{c.Title ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{c.Email ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{c.Phone ?? '—'}</td>
              <td className="px-4 py-3">{c.IsPrimaryContact ? <Badge label="Primary" color="blue" /> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EngagementsTab({ data }: { data?: EngagementEvent[] }) {
  if (!data || data.length === 0) return <EmptyState title="No engagement events recorded." />;
  const sorted = [...data].sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime());
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Next Step</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Outcome</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((e) => (
            <tr key={e.EngagementEventID} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-900">{e.Subject ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{new Date(e.EventDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-gray-700">{e.NextStep ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{e.Outcome ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunitiesTab({ data }: { data?: Opportunity[] }) {
  if (!data || data.length === 0) return <EmptyState title="No opportunities linked to this organization." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Opportunity</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Est. Value</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Target Close</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((o) => (
            <tr key={o.OpportunityID} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-900">{o.OpportunityName}</td>
              <td className="px-4 py-3 text-gray-700">{o.EstimatedValue ? `$${o.EstimatedValue.toLocaleString()}` : '—'}</td>
              <td className="px-4 py-3 text-gray-700">{o.TargetCloseDate ? new Date(o.TargetCloseDate).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3 text-gray-700">{o.OwnerName ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FacultyTab({ data }: { data?: Record<string, unknown>[] }) {
  if (!data || data.length === 0) return <EmptyState title="No faculty linkages." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {[row.FirstName, row.LastName].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">{String(row.LinkageRoleName ?? '—')}</td>
              <td className="px-4 py-3">
                {row.ActiveFlag ? (
                  <Badge label="Active" color="emerald" />
                ) : (
                  <Badge label="Inactive" color="slate" />
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">{String(row.Notes ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreTab({ data }: { data?: OrganizationScore | null }) {
  if (!data) return <EmptyState title="No partnership score has been calculated for this organization." />;
  const badge = getScoreBadge(data.OverallPartnershipScore);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-900">{data.OverallPartnershipScore}</span>
        <Badge label={badge.label} color={badge.color as React.ComponentProps<typeof Badge>['color']} size="md" />
        <span className="text-xs text-gray-400 ml-auto">
          Scored {data.ScoreDate ? new Date(data.ScoreDate).toLocaleDateString() : '—'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreBar label="Executive Engagement" value={data.ExecutiveEngagementScore} />
        <ScoreBar label="Multi-Touchpoint" value={data.MultiTouchpointScore} />
        <ScoreBar label="Faculty Alignment" value={data.FacultyAlignmentScore} />
        <ScoreBar label="Government Overlay" value={data.GovernmentOverlayScore} />
        <ScoreBar label="Advisory Board" value={data.AdvisoryBoardScore} />
        <ScoreBar label="Philanthropic Behavior" value={data.PhilanthropicBehaviorScore} />
        <ScoreBar label="Regional Identity" value={data.RegionalIdentityScore} />
      </div>
      {data.Notes && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-gray-700">{data.Notes}</p>
        </div>
      )}
    </div>
  );
}

function TagsTab({ data }: { data?: TagItem[] }) {
  if (!data || data.length === 0) return <EmptyState title="No strategic tags assigned." />;
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((t) => (
        <div key={t.tag.id} className="group">
          <Badge label={t.tag.name} color="purple" size="md" />
          {t.notes && <span className="ml-1 text-xs text-gray-400">{t.notes}</span>}
        </div>
      ))}
    </div>
  );
}

function AlignmentsTab({ data }: { data?: AlignmentItem[] }) {
  if (!data || data.length === 0) return <EmptyState title="No government alignments recorded." />;
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((a) => (
        <div key={a.alignment.id} className="group">
          <Badge label={a.alignment.name} color="indigo" size="md" />
          {a.notes && <span className="ml-1 text-xs text-gray-400">{a.notes}</span>}
        </div>
      ))}
    </div>
  );
}
