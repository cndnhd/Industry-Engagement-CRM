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
  fetchOrganizationEcosystem,
  fetchOrganizationSectors,
  fetchMaturityHistory,
  fetchJourneyLogs,
  createJourneyLog,
  updateJourneyLog,
  deleteJourneyLog,
  addMaturityTransition,
  addEcosystemLink,
  addOrganizationTag,
  removeOrganizationTag,
  setOrganizationSectors,
  createOrganizationScore,
  updateOrganizationScore,
  updateOrganization,
  deleteOrganization,
  addOrganizationFacultyLinkage,
  removeOrganizationFacultyLinkage,
  fetchFaculty,
  addOrganizationAlignment,
  removeOrganizationAlignment,
  loadLookup,
  resolveName,
} from '@/lib/api';
import type {
  Organization, Contact, EngagementEvent, Opportunity, OrganizationScore, LookupItem,
  JourneyLog, EcosystemLink, PartnershipStageHistoryEntry, Faculty,
} from '@/types';
import { getScoreBadge } from '@/types';
import Badge from '@/components/ui/Badge';
import ScoreBar from '@/components/ui/ScoreBar';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import JourneyTimeline from '@/components/journey/JourneyTimeline';
import JourneyEntryForm from '@/components/journey/JourneyEntryForm';
import type { JourneyFormData } from '@/components/journey/JourneyEntryForm';

type Tab =
  | 'contacts' | 'engagements' | 'opportunities' | 'faculty'
  | 'score' | 'tags' | 'alignments'
  | 'journey' | 'ecosystem' | 'maturity' | 'sectors';

const TABS: { key: Tab; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'engagements', label: 'Engagements' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'faculty', label: 'Faculty Linkages' },
  { key: 'score', label: 'Score' },
  { key: 'tags', label: 'Tags' },
  { key: 'alignments', label: 'Alignments' },
  { key: 'journey', label: 'Journey Log' },
  { key: 'ecosystem', label: 'Ecosystem' },
  { key: 'maturity', label: 'Maturity History' },
  { key: 'sectors', label: 'Sectors' },
];

const STRATEGIC_PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'None'];
const ENGAGEMENT_STATUSES = ['Active', 'Nurturing', 'Dormant', 'Lost', 'New', 'Prospect'];

type Lookups = Record<string, LookupItem[]>;
type TagItem = { tag: { id: number; name: string }; notes?: string };
type AlignmentItem = { alignment: { id: number; name: string }; notes?: string };
type Toast = { message: string; type: 'success' | 'error' };
type JourneyLogRow = JourneyLog & { JourneyStageName?: string; OrganizationName?: string };
type EcosystemLinkRow = EcosystemLink & { TypeName: string };
type MaturityRow = PartnershipStageHistoryEntry & { OldStageName?: string; NewStageName: string };
type SectorRow = { IndustrySectorID: number; SectorName: string };

const BOOLEAN_FLAGS: { key: keyof Organization; label: string; color: React.ComponentProps<typeof Badge>['color'] }[] = [
  { key: 'MissouriPresenceFlag', label: 'Missouri Presence', color: 'blue' },
  { key: 'InternshipPotentialFlag', label: 'Internship Potential', color: 'emerald' },
  { key: 'HiringPotentialFlag', label: 'Hiring Potential', color: 'emerald' },
  { key: 'SponsorshipPotentialFlag', label: 'Sponsorship Potential', color: 'blue' },
  { key: 'AdvisoryBoardPotentialFlag', label: 'Advisory Board Potential', color: 'blue' },
  { key: 'ResearchCollaborationPotentialFlag', label: 'Research Collaboration', color: 'emerald' },
];

const PRIORITY_BADGE_COLOR: Record<string, React.ComponentProps<typeof Badge>['color']> = {
  Critical: 'red', High: 'red', Medium: 'amber', Low: 'slate', None: 'gray',
};
const ENGAGEMENT_BADGE_COLOR: Record<string, React.ComponentProps<typeof Badge>['color']> = {
  Active: 'emerald', Nurturing: 'blue', Dormant: 'slate', Lost: 'red', New: 'cyan', Prospect: 'purple',
};

const INPUT_CLS = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = Number(params.id);

  const [org, setOrg] = useState<Organization | null>(null);
  const [lookups, setLookups] = useState<Lookups>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgTags, setOrgTags] = useState<TagItem[]>([]);

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
        const [o, tags, ...lkResults] = await Promise.all([
          fetchOrganization(orgId),
          fetchOrganizationTags(orgId),
          loadLookup('orgTypes'),
          loadLookup('ownershipTypes'),
          loadLookup('growthStages'),
          loadLookup('priorityLevels'),
          loadLookup('contractorRoles'),
          loadLookup('relationshipLevels'),
          loadLookup('partnershipStages'),
          loadLookup('journeyStages'),
          loadLookup('industrySectors'),
          loadLookup('ecosystemEntityTypes'),
          loadLookup('linkageRoles'),
          loadLookup('governmentAlignmentTypes'),
        ]);
        setOrg(o);
        setOrgTags(tags);
        setTabData((prev) => ({ ...prev, tags }));
        const names = [
          'orgTypes', 'ownershipTypes', 'growthStages', 'priorityLevels',
          'contractorRoles', 'relationshipLevels', 'partnershipStages',
          'journeyStages', 'industrySectors', 'ecosystemEntityTypes',
          'linkageRoles', 'governmentAlignmentTypes',
        ];
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
        case 'journey': {
          const all = await fetchJourneyLogs();
          data = all.filter((j) => j.OrganizationID === orgId);
          break;
        }
        case 'ecosystem': data = await fetchOrganizationEcosystem(orgId); break;
        case 'maturity': data = await fetchMaturityHistory(orgId); break;
        case 'sectors': data = await fetchOrganizationSectors(orgId); break;
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

  const refreshTab = useCallback(async () => {
    if (activeTab === 'tags') {
      const tags = await fetchOrganizationTags(orgId);
      setOrgTags(tags);
      setTabData((prev) => ({ ...prev, tags }));
    } else {
      setTabData((prev) => {
        const next = { ...prev };
        delete next[activeTab];
        return next;
      });
    }
  }, [activeTab, orgId]);

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
      PartnershipStageID: org.PartnershipStageID ?? '',
      StrategicPriorityLevel: org.StrategicPriorityLevel ?? '',
      EngagementStatus: org.EngagementStatus ?? '',
      AssignedOwner: org.AssignedOwner ?? '',
      AssignedTeam: org.AssignedTeam ?? '',
      NextActionDate: org.NextActionDate ? org.NextActionDate.split('T')[0] : '',
      LinkedInURL: org.LinkedInURL ?? '',
      GeneralEmail: org.GeneralEmail ?? '',
      MainPhone: org.MainPhone ?? '',
      HQCountry: org.HQCountry ?? '',
      PrimaryRegion: org.PrimaryRegion ?? '',
    });
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...editForm };
      ['OrgTypeID', 'OwnershipTypeID', 'GrowthStageID', 'PriorityLevelID', 'ContractorRoleID', 'RelationshipLevelID', 'PartnershipStageID'].forEach((k) => {
        if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
        else payload[k] = Number(payload[k]);
      });
      if (payload.RDIntensityPct === '' || payload.RDIntensityPct === undefined) payload.RDIntensityPct = null;
      else payload.RDIntensityPct = Number(payload.RDIntensityPct);
      ['StrategicPriorityLevel', 'EngagementStatus', 'AssignedOwner', 'AssignedTeam', 'LinkedInURL', 'GeneralEmail', 'MainPhone', 'HQCountry', 'PrimaryRegion'].forEach((k) => {
        if (payload[k] === '') payload[k] = null;
      });
      if (payload.NextActionDate === '') payload.NextActionDate = null;

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
  const partnershipStageName = resolveName(lookups.partnershipStages ?? [], org.PartnershipStageID);
  const priorityColor: Record<string, React.ComponentProps<typeof Badge>['color']> = {
    High: 'red', Medium: 'amber', Low: 'slate',
  };
  const activeFlags = BOOLEAN_FLAGS.filter((f) => org[f.key]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

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

        {/* Strategic overview row */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Strategic Overview</h3>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {partnershipStageName !== '—' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Stage:</span>
                <Badge label={partnershipStageName} color="indigo" size="md" />
              </div>
            )}
            {org.StrategicPriorityLevel && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Priority:</span>
                <Badge label={org.StrategicPriorityLevel} color={PRIORITY_BADGE_COLOR[org.StrategicPriorityLevel] ?? 'gray'} size="md" />
              </div>
            )}
            {org.EngagementStatus && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Status:</span>
                <Badge label={org.EngagementStatus} color={ENGAGEMENT_BADGE_COLOR[org.EngagementStatus] ?? 'gray'} size="md" />
              </div>
            )}
            {org.AssignedOwner && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Owner:</span>
                <span className="text-sm font-medium text-gray-900">{org.AssignedOwner}</span>
              </div>
            )}
            {org.NextActionDate && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Next Action:</span>
                <span className="text-sm font-medium text-gray-900">{new Date(org.NextActionDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Strategic tags */}
        {orgTags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Strategic Tags</h3>
            <div className="flex flex-wrap gap-2">
              {orgTags.map((t) => (
                <Badge key={t.tag.id} label={t.tag.name} color="purple" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Boolean flags */}
        {activeFlags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Flags</h3>
            <div className="flex flex-wrap gap-2">
              {activeFlags.map((f) => (
                <Badge key={f.key} label={f.label} color={f.color} size="sm" />
              ))}
            </div>
          </div>
        )}

        {org.Notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{org.Notes}</p>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-6 -mb-px min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          <TabContent tab={activeTab} data={tabData[activeTab]} orgId={orgId} lookups={lookups} onRefresh={refreshTab} />
        )}
      </div>

      {/* Edit Organization Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Organization" size="xl">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="edit-org-name" className="text-sm font-medium text-gray-700">Organization Name *</label>
              <input id="edit-org-name" required type="text" value={(editForm.OrganizationName as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, OrganizationName: e.target.value }))} className={INPUT_CLS} />
            </div>

            <div>
              <label htmlFor="edit-city" className="text-sm font-medium text-gray-700">City</label>
              <input id="edit-city" type="text" value={(editForm.City as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, City: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-state" className="text-sm font-medium text-gray-700">State</label>
              <input id="edit-state" type="text" value={(editForm.State as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, State: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-hq-location" className="text-sm font-medium text-gray-700">Headquarters Location</label>
              <input id="edit-hq-location" type="text" value={(editForm.HeadquartersLocation as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, HeadquartersLocation: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-regional" className="text-sm font-medium text-gray-700">Regional Footprint</label>
              <input id="edit-regional" type="text" value={(editForm.RegionalFootprint as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, RegionalFootprint: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-hq-country" className="text-sm font-medium text-gray-700">HQ Country</label>
              <input id="edit-hq-country" type="text" value={(editForm.HQCountry as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, HQCountry: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-primary-region" className="text-sm font-medium text-gray-700">Primary Region</label>
              <input id="edit-primary-region" type="text" value={(editForm.PrimaryRegion as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, PrimaryRegion: e.target.value }))} className={INPUT_CLS} />
            </div>

            <SelectField id="edit-org-type" label="Organization Type" value={editForm.OrgTypeID} onChange={(v) => setEditForm((f) => ({ ...f, OrgTypeID: v }))} items={lookups.orgTypes} />
            <SelectField id="edit-ownership" label="Ownership Type" value={editForm.OwnershipTypeID} onChange={(v) => setEditForm((f) => ({ ...f, OwnershipTypeID: v }))} items={lookups.ownershipTypes} />
            <SelectField id="edit-growth" label="Growth Stage" value={editForm.GrowthStageID} onChange={(v) => setEditForm((f) => ({ ...f, GrowthStageID: v }))} items={lookups.growthStages} />
            <SelectField id="edit-priority" label="Priority Level" value={editForm.PriorityLevelID} onChange={(v) => setEditForm((f) => ({ ...f, PriorityLevelID: v }))} items={lookups.priorityLevels} />
            <SelectField id="edit-partnership-stage" label="Partnership Stage" value={editForm.PartnershipStageID} onChange={(v) => setEditForm((f) => ({ ...f, PartnershipStageID: v }))} items={lookups.partnershipStages} />
            <SelectField id="edit-contractor" label="Contractor Role" value={editForm.ContractorRoleID} onChange={(v) => setEditForm((f) => ({ ...f, ContractorRoleID: v }))} items={lookups.contractorRoles} />
            <SelectField id="edit-relationship" label="Relationship Level" value={editForm.RelationshipLevelID} onChange={(v) => setEditForm((f) => ({ ...f, RelationshipLevelID: v }))} items={lookups.relationshipLevels} />

            <div>
              <label htmlFor="edit-strategic-priority" className="text-sm font-medium text-gray-700">Strategic Priority</label>
              <select id="edit-strategic-priority" value={(editForm.StrategicPriorityLevel as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, StrategicPriorityLevel: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {STRATEGIC_PRIORITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="edit-engagement-status" className="text-sm font-medium text-gray-700">Engagement Status</label>
              <select id="edit-engagement-status" value={(editForm.EngagementStatus as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, EngagementStatus: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {ENGAGEMENT_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="edit-assigned-owner" className="text-sm font-medium text-gray-700">Assigned Owner</label>
              <input id="edit-assigned-owner" type="text" value={(editForm.AssignedOwner as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, AssignedOwner: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-assigned-team" className="text-sm font-medium text-gray-700">Assigned Team</label>
              <input id="edit-assigned-team" type="text" value={(editForm.AssignedTeam as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, AssignedTeam: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-next-action-date" className="text-sm font-medium text-gray-700">Next Action Date</label>
              <input id="edit-next-action-date" type="date" value={(editForm.NextActionDate as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, NextActionDate: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-linkedin" className="text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input id="edit-linkedin" type="url" value={(editForm.LinkedInURL as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, LinkedInURL: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-general-email" className="text-sm font-medium text-gray-700">General Email</label>
              <input id="edit-general-email" type="email" value={(editForm.GeneralEmail as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, GeneralEmail: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-main-phone" className="text-sm font-medium text-gray-700">Main Phone</label>
              <input id="edit-main-phone" type="tel" value={(editForm.MainPhone as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, MainPhone: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-email-pattern" className="text-sm font-medium text-gray-700">Email Pattern</label>
              <input id="edit-email-pattern" type="text" value={(editForm.EmailPattern as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, EmailPattern: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="edit-rd-intensity" className="text-sm font-medium text-gray-700">R&D Intensity (%)</label>
              <input id="edit-rd-intensity" type="number" value={(editForm.RDIntensityPct as string | number) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, RDIntensityPct: e.target.value }))} className={INPUT_CLS} />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input id="edit-federal" type="checkbox" checked={!!editForm.FederalContractor} onChange={(e) => setEditForm((f) => ({ ...f, FederalContractor: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="edit-federal" className="text-sm font-medium text-gray-700">Federal Contractor</label>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input id="edit-champion" type="checkbox" checked={!!editForm.ChampionIdentified} onChange={(e) => setEditForm((f) => ({ ...f, ChampionIdentified: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="edit-champion" className="text-sm font-medium text-gray-700">Champion Identified</label>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input id="edit-exec-sponsor" type="checkbox" checked={!!editForm.ExecutiveSponsor} onChange={(e) => setEditForm((f) => ({ ...f, ExecutiveSponsor: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="edit-exec-sponsor" className="text-sm font-medium text-gray-700">Executive Sponsor</label>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="edit-notes" className="text-sm font-medium text-gray-700">Notes</label>
              <textarea id="edit-notes" rows={3} value={(editForm.Notes as string) ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, Notes: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
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

function SelectField({ id, label, value, onChange, items }: {
  id: string; label: string; value: unknown;
  onChange: (v: string) => void; items?: LookupItem[];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS}>
        <option value="">— Select —</option>
        {(items ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
  );
}

function TabContent({ tab, data, orgId, lookups, onRefresh }: {
  tab: Tab; data: unknown; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  switch (tab) {
    case 'contacts':      return <ContactsTab data={data as Contact[] | undefined} />;
    case 'engagements':   return <EngagementsTab data={data as EngagementEvent[] | undefined} />;
    case 'opportunities': return <OpportunitiesTab data={data as Opportunity[] | undefined} />;
    case 'faculty':       return <FacultyTab data={data as Record<string, unknown>[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    case 'score':         return <ScoreTab data={data as OrganizationScore | null | undefined} orgId={orgId} onRefresh={onRefresh} />;
    case 'tags':          return <TagsTab data={data as TagItem[] | undefined} orgId={orgId} onRefresh={onRefresh} />;
    case 'alignments':    return <AlignmentsTab data={data as AlignmentItem[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    case 'journey':       return <JourneyTab data={data as JourneyLogRow[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    case 'ecosystem':     return <EcosystemTab data={data as EcosystemLinkRow[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    case 'maturity':      return <MaturityTab data={data as MaturityRow[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    case 'sectors':       return <SectorsTab data={data as SectorRow[] | undefined} orgId={orgId} lookups={lookups} onRefresh={onRefresh} />;
    default:              return null;
  }
}

/* ---------- Existing tabs ---------- */

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

function FacultyTab({ data, orgId, lookups, onRefresh }: {
  data?: Record<string, unknown>[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>({ ActiveFlag: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showAdd && allFaculty.length === 0) {
      fetchFaculty().then(setAllFaculty).catch(() => {});
    }
  }, [showAdd, allFaculty.length]);

  async function handleAdd() {
    if (!form.FacultyID) return;
    setSaving(true);
    try {
      await addOrganizationFacultyLinkage(orgId, {
        FacultyID: Number(form.FacultyID),
        LinkageRoleID: form.LinkageRoleID ? Number(form.LinkageRoleID) : null,
        ActiveFlag: !!form.ActiveFlag,
        Notes: (form.Notes as string) || null,
      });
      setShowAdd(false);
      setForm({ ActiveFlag: true });
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add faculty linkage');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(linkageId: number) {
    setSaving(true);
    try {
      await removeOrganizationFacultyLinkage(orgId, linkageId);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove faculty linkage');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Faculty Linkages</h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showAdd ? 'Cancel' : 'Add Faculty Linkage'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Faculty *</label>
              <select value={String(form.FacultyID ?? '')} onChange={(e) => setForm((f) => ({ ...f, FacultyID: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select Faculty —</option>
                {allFaculty.map((fac) => (
                  <option key={fac.FacultyID} value={fac.FacultyID}>
                    {fac.FirstName} {fac.LastName}{fac.Title ? ` — ${fac.Title}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Role</label>
              <select value={String(form.LinkageRoleID ?? '')} onChange={(e) => setForm((f) => ({ ...f, LinkageRoleID: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select Role —</option>
                {(lookups.linkageRoles ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="fac-active"
                type="checkbox"
                checked={!!form.ActiveFlag}
                onChange={(e) => setForm((f) => ({ ...f, ActiveFlag: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fac-active" className="text-sm font-medium text-gray-700">Active</label>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <textarea
                value={(form.Notes as string) ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                rows={2}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving || !form.FacultyID} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {(!data || data.length === 0) && !showAdd ? (
        <EmptyState title="No faculty linkages." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data ?? []).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {[row.FirstName, row.LastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{String(row.DepartmentName ?? '—')}</td>
                  <td className="px-4 py-3 text-gray-700">{String(row.FacultyTitle ?? row.Title ?? '—')}</td>
                  <td className="px-4 py-3 text-gray-700">{String(row.LinkageRoleName ?? '—')}</td>
                  <td className="px-4 py-3">
                    {row.ActiveFlag ? (
                      <Badge label="Active" color="emerald" />
                    ) : (
                      <Badge label="Inactive" color="slate" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{String(row.Notes ?? '—')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(row.OrganizationFacultyLinkageID as number)}
                      disabled={saving}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const SCORE_FIELDS: { key: keyof OrganizationScore; label: string; weight: string }[] = [
  { key: 'ExecutiveEngagementScore', label: 'Executive Engagement', weight: '25%' },
  { key: 'MultiTouchpointScore', label: 'Multi-Touchpoint', weight: '20%' },
  { key: 'FacultyAlignmentScore', label: 'Faculty Alignment', weight: '15%' },
  { key: 'GovernmentOverlayScore', label: 'Government Overlay', weight: '10%' },
  { key: 'AdvisoryBoardScore', label: 'Advisory Board', weight: '10%' },
  { key: 'PhilanthropicBehaviorScore', label: 'Philanthropic Behavior', weight: '10%' },
  { key: 'RegionalIdentityScore', label: 'Regional Identity', weight: '10%' },
];

function ScoreTab({ data, orgId, onRefresh }: { data?: OrganizationScore | null; orgId: number; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const hasScore = !!data;

  function openEdit() {
    setForm({
      ExecutiveEngagementScore: String(data?.ExecutiveEngagementScore ?? 0),
      MultiTouchpointScore: String(data?.MultiTouchpointScore ?? 0),
      FacultyAlignmentScore: String(data?.FacultyAlignmentScore ?? 0),
      GovernmentOverlayScore: String(data?.GovernmentOverlayScore ?? 0),
      AdvisoryBoardScore: String(data?.AdvisoryBoardScore ?? 0),
      PhilanthropicBehaviorScore: String(data?.PhilanthropicBehaviorScore ?? 0),
      RegionalIdentityScore: String(data?.RegionalIdentityScore ?? 0),
      Notes: data?.Notes ?? '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      for (const f of SCORE_FIELDS) {
        const v = parseFloat(form[f.key] || '0');
        body[f.key] = isNaN(v) ? 0 : Math.min(5, Math.max(0, v));
      }
      body.Notes = form.Notes || null;
      if (hasScore) {
        await updateOrganizationScore(orgId, body);
      } else {
        await createOrganizationScore(orgId, body);
      }
      setEditing(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save scores');
    }
    setSaving(false);
  }

  function handleChange(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  if (!hasScore && !editing) {
    return (
      <div className="text-center py-8 space-y-3">
        <EmptyState title="No partnership score has been calculated for this organization." />
        <button
          type="button"
          onClick={openEdit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Score
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{hasScore ? 'Edit Scores' : 'Create Scores'}</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">Each sub-score ranges from 0 to 5. The overall score is computed automatically.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCORE_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label} <span className="text-gray-400">({f.weight})</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0" max="5" step="0.1"
                  value={form[f.key] || '0'}
                  onChange={e => handleChange(f.key, e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min="0" max="5" step="0.1"
                  value={form[f.key] || '0'}
                  onChange={e => handleChange(f.key, e.target.value)}
                  className="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm text-center"
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={form.Notes || ''}
            onChange={e => handleChange('Notes', e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
    );
  }

  const badge = getScoreBadge(data!.OverallPartnershipScore);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-900">{data!.OverallPartnershipScore}</span>
        <Badge label={badge.label} color={badge.color as React.ComponentProps<typeof Badge>['color']} size="md" />
        <span className="text-xs text-gray-400 ml-auto">
          Scored {data!.ScoreDate ? new Date(data!.ScoreDate).toLocaleDateString() : '—'}
        </span>
        <button
          type="button"
          onClick={openEdit}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Edit Scores
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SCORE_FIELDS.map(f => (
          <ScoreBar key={f.key} label={f.label} value={(data![f.key] as number) ?? 0} />
        ))}
      </div>
      {data!.Notes && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-gray-700">{data!.Notes}</p>
        </div>
      )}
    </div>
  );
}

function TagsTab({ data, orgId, onRefresh }: { data?: TagItem[]; orgId: number; onRefresh: () => void }) {
  const [allTags, setAllTags] = useState<LookupItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLookup('strategicTags').then(setAllTags).catch(() => {});
  }, []);

  const assignedIds = new Set((data ?? []).map(t => t.tag.id));
  const available = allTags.filter(t => !assignedIds.has(t.id));

  async function handleAdd(tagId: number) {
    setSaving(true);
    try {
      await addOrganizationTag(orgId, tagId);
      onRefresh();
      setShowPicker(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleRemove(tagId: number) {
    setSaving(true);
    try {
      await removeOrganizationTag(orgId, tagId);
      onRefresh();
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Assigned Tags</h3>
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Tag
        </button>
      </div>

      {showPicker && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Select a tag to assign:</p>
          {available.length === 0 ? (
            <p className="text-xs text-gray-400">All tags are already assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleAdd(t.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-purple-50 hover:text-purple-700 hover:ring-purple-300 transition-colors disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(!data || data.length === 0) && !showPicker ? (
        <EmptyState title="No strategic tags assigned." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(data ?? []).map((t) => (
            <span
              key={t.tag.id}
              className="group inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
            >
              {t.tag.name}
              <button
                onClick={() => handleRemove(t.tag.id)}
                disabled={saving}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-purple-200 text-purple-500 hover:text-purple-800 disabled:opacity-50"
                title={`Remove ${t.tag.name}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AlignmentsTab({ data, orgId, lookups, onRefresh }: {
  data?: AlignmentItem[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const allAlignments = lookups.governmentAlignmentTypes ?? [];
  const assignedIds = new Set((data ?? []).map(a => a.alignment.id));
  const available = allAlignments.filter(a => !assignedIds.has(a.id));

  async function handleAdd(alignmentTypeId: number) {
    setSaving(true);
    try {
      await addOrganizationAlignment(orgId, alignmentTypeId);
      onRefresh();
      setShowPicker(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleRemove(alignmentTypeId: number) {
    setSaving(true);
    try {
      await removeOrganizationAlignment(orgId, alignmentTypeId);
      onRefresh();
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Government Alignments</h3>
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Alignment
        </button>
      </div>

      {showPicker && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Select an alignment to assign:</p>
          {available.length === 0 ? (
            <p className="text-xs text-gray-400">All alignments are already assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleAdd(a.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300 transition-colors disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(!data || data.length === 0) && !showPicker ? (
        <EmptyState title="No government alignments recorded." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(data ?? []).map((a) => (
            <span
              key={a.alignment.id}
              className="group inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
            >
              {a.alignment.name}
              {a.notes && <span className="text-xs text-indigo-400 ml-0.5">({a.notes})</span>}
              <button
                onClick={() => handleRemove(a.alignment.id)}
                disabled={saving}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 text-indigo-500 hover:text-indigo-800 disabled:opacity-50"
                title={`Remove ${a.alignment.name}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- New tabs ---------- */

function JourneyTab({ data, orgId, lookups, onRefresh }: {
  data?: JourneyLogRow[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JourneyLogRow | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...(data ?? [])].sort(
    (a, b) => new Date(b.LogDate ?? '').getTime() - new Date(a.LogDate ?? '').getTime(),
  );

  async function handleSave(formData: JourneyFormData) {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        OrganizationID: orgId,
        JourneyStageID: formData.JourneyStageID || null,
        LogDate: formData.LogDate || new Date().toISOString().split('T')[0],
        EventType: formData.EventType || null,
        Outcome: formData.Outcome || null,
        NextStep: formData.NextStep || null,
        NextStepDate: formData.NextStepDate || null,
        Owner: formData.Owner || null,
        Notes: formData.Notes || null,
        Summary: formData.Summary || null,
      };
      if (editingEntry) {
        await updateJourneyLog(editingEntry.JourneyLogID, payload);
      } else {
        await createJourneyLog(payload);
      }
      setShowForm(false);
      setEditingEntry(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save journey log');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry: JourneyLog) {
    setEditingEntry(entry as JourneyLogRow);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    try {
      await deleteJourneyLog(id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete journey log');
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingEntry(null);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        {!showForm && (
          <button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add Entry
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
          <JourneyEntryForm
            entry={editingEntry}
            organizations={[]}
            journeyStages={lookups.journeyStages ?? []}
            onSave={handleSave}
            onCancel={handleCancel}
            fixedOrgId={orgId}
            saving={saving}
          />
        </div>
      )}

      <JourneyTimeline
        entries={sorted}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function EcosystemTab({ data, orgId, lookups, onRefresh }: {
  data?: EcosystemLinkRow[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.RelatedName?.trim()) return;
    setSaving(true);
    try {
      await addEcosystemLink(orgId, {
        EntityTypeID: form.EntityTypeID ? Number(form.EntityTypeID) : null,
        RelatedName: form.RelatedName.trim(),
        Notes: form.Notes || null,
      });
      setShowAdd(false);
      setForm({});
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add ecosystem link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showAdd ? 'Cancel' : 'Add Link'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Type</label>
              <select value={form.EntityTypeID ?? ''} onChange={(e) => setForm((f) => ({ ...f, EntityTypeID: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {(lookups.ecosystemEntityTypes ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Related Name *</label>
              <input type="text" value={form.RelatedName ?? ''} onChange={(e) => setForm((f) => ({ ...f, RelatedName: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <input type="text" value={form.Notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving || !form.RelatedName?.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {(!data || data.length === 0) ? (
        <EmptyState title="No ecosystem links for this organization." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Related Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((link) => (
                <tr key={link.EcosystemLinkID} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-700">{link.TypeName ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{link.RelatedName}</td>
                  <td className="px-4 py-3 text-gray-700">{link.Notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MaturityTab({ data, orgId, lookups, onRefresh }: {
  data?: MaturityRow[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.NewStageID) return;
    setSaving(true);
    try {
      await addMaturityTransition(orgId, {
        NewStageID: Number(form.NewStageID),
        TransitionDate: form.TransitionDate || new Date().toISOString().split('T')[0],
        Notes: form.Notes || null,
      });
      setShowAdd(false);
      setForm({});
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add maturity transition');
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...(data ?? [])].sort(
    (a, b) => new Date(b.TransitionDate).getTime() - new Date(a.TransitionDate).getTime(),
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showAdd ? 'Cancel' : 'Add Transition'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">New Stage *</label>
              <select value={form.NewStageID ?? ''} onChange={(e) => setForm((f) => ({ ...f, NewStageID: e.target.value }))} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {(lookups.partnershipStages ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Transition Date</label>
              <input type="date" value={form.TransitionDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, TransitionDate: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <input type="text" value={form.Notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving || !form.NewStageID} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState title="No maturity transitions recorded." />
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-4 space-y-0">
          {sorted.map((row) => (
            <div key={row.HistoryID} className="relative pl-8 pb-6">
              <div className="absolute left-[-9px] top-1 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white" />
              <div className="text-xs text-gray-500 mb-0.5">{new Date(row.TransitionDate).toLocaleDateString()}</div>
              <div className="font-medium text-gray-900">
                {row.OldStageName ? (
                  <>{row.OldStageName} <span className="text-gray-400 mx-1">&rarr;</span> {row.NewStageName}</>
                ) : (
                  <>Initial: {row.NewStageName}</>
                )}
              </div>
              {row.Notes && <div className="text-sm text-gray-600 mt-0.5">{row.Notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectorsTab({ data, orgId, lookups, onRefresh }: {
  data?: SectorRow[]; orgId: number; lookups: Lookups; onRefresh: () => void;
}) {
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const allSectors = lookups.industrySectors ?? [];

  function startManaging() {
    setSelected((data ?? []).map((s) => s.IndustrySectorID));
    setManaging(true);
  }

  function toggleSector(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setOrganizationSectors(orgId, selected);
      setManaging(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sectors');
    } finally {
      setSaving(false);
    }
  }

  if (managing) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-3">Click sectors to toggle selection:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {allSectors.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSector(s.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors ${
                selected.includes(s.id)
                  ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20'
                  : 'bg-gray-50 text-gray-500 ring-gray-300 hover:bg-gray-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        {allSectors.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">No industry sectors configured in lookups.</p>
        )}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setManaging(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={startManaging} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Manage Sectors
        </button>
      </div>
      {(!data || data.length === 0) ? (
        <EmptyState title="No sectors assigned to this organization." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.map((s) => (
            <Badge key={s.IndustrySectorID} label={s.SectorName} color="cyan" size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
