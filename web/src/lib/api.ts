// API client — all data comes from Azure SQL via Next.js API routes.
// No mock data fallbacks.

import type {
  Organization,
  Contact,
  Faculty,
  EngagementEvent,
  Opportunity,
  OrganizationScore,
  LookupItem,
  UserList,
  UserListColumn,
  ListMembershipRow,
  StrategicRollup,
  RollupComponent,
  RollupContactRow,
  JourneyLog,
  EcosystemLink,
  PartnershipStageHistoryEntry,
  SegmentDefinition,
} from '@/types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `API error ${res.status}`);
  }
  return res.json();
}

async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `API error ${res.status}`);
  }
  return res.json();
}

async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `API error ${res.status}`);
  }
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `API error ${res.status}`);
  }
}

// Organizations
export const fetchOrganizations = () => get<Organization[]>('/organizations');
export const fetchOrganization = (id: number) => get<Organization>(`/organizations/${id}`);
export const createOrganization = (body: Record<string, unknown>) => post<Organization>('/organizations', body);
export const updateOrganization = (id: number, body: Record<string, unknown>) => put<Organization>(`/organizations/${id}`, body);
export const deleteOrganization = (id: number) => del(`/organizations/${id}`);
export const fetchOrganizationContacts = (id: number) => get<Contact[]>(`/organizations/${id}/contacts`);
export const fetchOrganizationEvents = (id: number) => get<EngagementEvent[]>(`/organizations/${id}/events`);
export const fetchOrganizationOpportunities = (id: number) => get<Opportunity[]>(`/organizations/${id}/opportunities`);
export const fetchOrganizationScore = (id: number) => get<OrganizationScore>(`/organizations/${id}/score`).catch(() => null);
export const createOrganizationScore = (id: number, body: Record<string, unknown>) => post<OrganizationScore>(`/organizations/${id}/score`, body);
export const updateOrganizationScore = (id: number, body: Record<string, unknown>) => put<OrganizationScore>(`/organizations/${id}/score`, body);
export const fetchOrganizationTags = (id: number) =>
  get<{ id: number; name: string; Notes?: string }[]>(`/organizations/${id}/tags`)
    .then(rows => rows.map(r => ({ tag: { id: r.id, name: r.name }, notes: r.Notes })));
export const fetchOrganizationAlignments = (id: number) =>
  get<{ id: number; name: string; Notes?: string }[]>(`/organizations/${id}/alignments`)
    .then(rows => rows.map(r => ({ alignment: { id: r.id, name: r.name }, notes: r.Notes })));
export const fetchOrganizationFacultyLinkages = (id: number) =>
  get<Record<string, unknown>[]>(`/organizations/${id}/faculty-linkages`);
export const addOrganizationFacultyLinkage = (orgId: number, body: Record<string, unknown>) =>
  post<{ id: number }>(`/organizations/${orgId}/faculty-linkages`, body);
export const removeOrganizationFacultyLinkage = (orgId: number, linkageId: number) =>
  fetch(`${BASE}/organizations/${orgId}/faculty-linkages`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkageId }),
  }).then(async (res) => { if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `API error ${res.status}`); } });

// Contacts
export const fetchContacts = () => get<Contact[]>('/contacts');
export const fetchContactsByOrg = (orgId: number) => get<Contact[]>(`/contacts?organizationId=${orgId}`);
export const fetchContact = (id: number) => get<Contact>(`/contacts/${id}`);
export const createContact = (body: Record<string, unknown>) => post<Contact>('/contacts', body);
export const updateContact = (id: number, body: Record<string, unknown>) => put<Contact>(`/contacts/${id}`, body);
export const deleteContact = (id: number) => del(`/contacts/${id}`);

// User lists
export const fetchUserLists = (opts?: { q?: string; entityType?: 'C' | 'O' }) => {
  const p = new URLSearchParams();
  if (opts?.q) p.set('q', opts.q);
  if (opts?.entityType) p.set('entityType', opts.entityType);
  const q = p.toString();
  return get<UserList[]>(`/lists${q ? `?${q}` : ''}`);
};
export const createUserList = (body: Record<string, unknown>) => post<UserList>('/lists', body);
export const fetchUserList = (id: number) => get<UserList>(`/lists/${id}`);
export const updateUserList = (id: number, body: Record<string, unknown>) => patch<UserList>(`/lists/${id}`, body);
export const deleteUserList = (id: number) => del(`/lists/${id}`);
export const fetchListColumns = (listId: number) => get<UserListColumn[]>(`/lists/${listId}/columns`);
export const createListColumn = (listId: number, body: Record<string, unknown>) =>
  post<UserListColumn>(`/lists/${listId}/columns`, body);
export const updateListColumn = (listId: number, columnId: number, body: Record<string, unknown>) =>
  patch<UserListColumn>(`/lists/${listId}/columns/${columnId}`, body);
export const deleteListColumn = (listId: number, columnId: number) => del(`/lists/${listId}/columns/${columnId}`);
export const fetchListMemberships = (listId: number) =>
  get<{ memberships: ListMembershipRow[] }>(`/lists/${listId}/memberships`).then((r) => r.memberships);
export const addListMembership = (listId: number, body: { ContactID?: number; OrganizationID?: number }) =>
  post<Record<string, unknown>>(`/lists/${listId}/memberships`, body);
export const removeListMembership = (listId: number, membershipId: number) =>
  del(`/lists/${listId}/memberships/${membershipId}`);
export const patchListMembershipCells = (
  listId: number,
  membershipId: number,
  cells: { columnId: number; completionLevel: number }[],
) => patch<{ success: boolean }>(`/lists/${listId}/memberships/${membershipId}/cells`, { cells });

// Strategic rollups
export const fetchStrategicRollups = (opts?: { q?: string }) => {
  const q = opts?.q ? `?q=${encodeURIComponent(opts.q)}` : '';
  return get<StrategicRollup[]>(`/rollups${q}`);
};
export const createStrategicRollup = (body: Record<string, unknown>) => post<StrategicRollup>('/rollups', body);
export const fetchStrategicRollup = (id: number) => get<StrategicRollup>(`/rollups/${id}`);
export const updateStrategicRollup = (id: number, body: Record<string, unknown>) => patch<StrategicRollup>(`/rollups/${id}`, body);
export const deleteStrategicRollup = (id: number) => del(`/rollups/${id}`);
export const fetchRollupComponents = (rollupId: number) =>
  get<RollupComponent[]>(`/rollups/${rollupId}/components`);
export const createRollupComponent = (rollupId: number, body: Record<string, unknown>) =>
  post<RollupComponent>(`/rollups/${rollupId}/components`, body);
export const updateRollupComponent = (rollupId: number, componentId: number, body: Record<string, unknown>) =>
  patch<RollupComponent>(`/rollups/${rollupId}/components/${componentId}`, body);
export const deleteRollupComponent = (rollupId: number, componentId: number) =>
  del(`/rollups/${rollupId}/components/${componentId}`);
export const fetchRollupContacts = (rollupId: number) => get<RollupContactRow[]>(`/rollups/${rollupId}/contacts`);
export const addRollupContact = (rollupId: number, body: Record<string, unknown>) =>
  post<Record<string, unknown>>(`/rollups/${rollupId}/contacts`, body);
export const updateRollupContact = (rollupId: number, contactId: number, body: Record<string, unknown>) =>
  patch<Record<string, unknown>>(`/rollups/${rollupId}/contacts/${contactId}`, body);
export const removeRollupContact = (rollupId: number, contactId: number) =>
  del(`/rollups/${rollupId}/contacts/${contactId}`);

// Faculty
export const fetchFaculty = () => get<Faculty[]>('/faculty');
export const createFaculty = (body: Record<string, unknown>) => post<Faculty>('/faculty', body);
export const updateFaculty = (id: number, body: Record<string, unknown>) => put<Faculty>(`/faculty/${id}`, body);
export const deleteFaculty = (id: number) => del(`/faculty/${id}`);
export const fetchFacultyLinkages = (id: number) => get<Record<string, unknown>[]>(`/faculty/${id}/linkages`);

// Engagement Events
export const fetchEngagementEvents = () => get<EngagementEvent[]>('/engagements');
export const createEngagement = (body: Record<string, unknown>) => post<EngagementEvent>('/engagements', body);
export const updateEngagement = (id: number, body: Record<string, unknown>) => put<EngagementEvent>(`/engagements/${id}`, body);
export const deleteEngagement = (id: number) => del(`/engagements/${id}`);

// Opportunities
export const fetchOpportunities = () => get<Opportunity[]>('/opportunities');
export const createOpportunity = (body: Record<string, unknown>) => post<Opportunity>('/opportunities', body);
export const updateOpportunity = (id: number, body: Record<string, unknown>) => put<Opportunity>(`/opportunities/${id}`, body);
export const deleteOpportunity = (id: number) => del(`/opportunities/${id}`);

// Scores
export const fetchScoresRanked = () =>
  get<(OrganizationScore & { OrganizationName: string })[]>('/scores');

// Dashboard
export type DashboardStats = {
  totalOrgs: number;
  totalContacts: number;
  activeOpps: number;
  recentEvents: number;
  avgScore: number;
  dormantOrgs: number;
  overdueActions: number;
  upcomingActions: number;
  recentJourneyEntries: number;
  savedSegments: number;
};

export type TagDistribution = { tagName: string; orgCount: number };
export type MaturityDistribution = { stageName: string; stageLevel: number; orgCount: number };
export type OverdueFollowUp = {
  OrganizationID: number;
  OrganizationName: string;
  NextActionDate: string;
  AssignedOwner: string | null;
  LastMeaningfulEngagement: string | null;
};

export type RecentJourneyLog = {
  JourneyLogID: number;
  OrganizationName: string | null;
  JourneyStageName: string | null;
  LogDate: string | null;
  EventType: string | null;
  Outcome: string | null;
  Notes: string | null;
  Owner: string | null;
};

export type ActivityDistribution = { eventType: string; count: number };

export type DashboardResponse = {
  stats: DashboardStats;
  tagDistribution: TagDistribution[];
  maturityDistribution: MaturityDistribution[];
  overdueFollowUps: OverdueFollowUp[];
  recentJourneyLogs: RecentJourneyLog[];
  activityDistribution: ActivityDistribution[];
};

export const fetchDashboardStats = () => get<DashboardResponse>('/dashboard');

// Lookups
export const fetchLookup = (table: string) => get<LookupItem[]>(`/lookups/${table}`);
export const addLookupValue = (table: string, name: string, sortOrder?: number) =>
  post<LookupItem>(`/lookups/${table}`, { name, sortOrder });
export async function deleteLookupValue(table: string, id: number): Promise<void> {
  const res = await fetch(`${BASE}/lookups/${table}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `API error ${res.status}`);
  }
}

// Tags & Alignments aggregate
export const fetchTagsSummary = () => get<{ id: number; name: string; orgCount: number }[]>('/tags');
export const fetchAlignmentsSummary = () => get<{ id: number; name: string; orgCount: number }[]>('/alignments');

// Org-alignment mutations
export const addOrganizationAlignment = (orgId: number, alignmentTypeId: number) =>
  post<{ id: number }>(`/organizations/${orgId}/alignments`, { alignmentTypeId });
export const removeOrganizationAlignment = (orgId: number, alignmentTypeId: number) =>
  fetch(`${BASE}/organizations/${orgId}/alignments`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alignmentTypeId }),
  }).then(async (res) => { if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `API error ${res.status}`); } });

// Alignment -> organizations
export const fetchAlignmentOrganizations = (alignmentId: number) =>
  get<{ OrganizationID: number; OrganizationName: string; City?: string; State?: string; EngagementStatus?: string; AssignedOwner?: string }[]>(
    `/alignments/${alignmentId}/organizations`
  );
export const addAlignmentOrganization = (alignmentId: number, organizationId: number) =>
  post<{ id: number }>(`/alignments/${alignmentId}/organizations`, { organizationId });
export const removeAlignmentOrganization = (alignmentId: number, organizationId: number) =>
  fetch(`${BASE}/alignments/${alignmentId}/organizations`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  }).then(async (res) => { if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `API error ${res.status}`); } });

// Org-tag mutations
export const addOrganizationTag = (orgId: number, tagId: number) =>
  post<{ id: number }>(`/organizations/${orgId}/tags`, { tagId });
export const removeOrganizationTag = (orgId: number, tagId: number) => {
  return fetch(`${BASE}/organizations/${orgId}/tags`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagId }),
  }).then(async (res) => {
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error ?? `API error ${res.status}`);
    }
  });
};

// Tag -> organizations
export const fetchTagOrganizations = (tagId: number) =>
  get<{ OrganizationID: number; OrganizationName: string; City?: string; State?: string; EngagementStatus?: string; AssignedOwner?: string }[]>(
    `/tags/${tagId}/organizations`
  );
export const addTagOrganization = (tagId: number, organizationId: number) =>
  post<{ id: number }>(`/tags/${tagId}/organizations`, { organizationId });
export const removeTagOrganization = (tagId: number, organizationId: number) => {
  return fetch(`${BASE}/tags/${tagId}/organizations`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  }).then(async (res) => {
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error ?? `API error ${res.status}`);
    }
  });
};

// Journey Log
export const fetchJourneyLogs = () => get<(JourneyLog & { JourneyStageName?: string; OrganizationName?: string })[]>('/journey');
export const fetchJourneyLog = (id: number) => get<JourneyLog>(`/journey/${id}`);
export const createJourneyLog = (body: Record<string, unknown>) => post<JourneyLog>('/journey', body);
export const updateJourneyLog = (id: number, body: Record<string, unknown>) => put<JourneyLog>(`/journey/${id}`, body);
export const deleteJourneyLog = (id: number) => del(`/journey/${id}`);

// Organization ecosystem
export const fetchOrganizationEcosystem = (orgId: number) =>
  get<(EcosystemLink & { TypeName: string })[]>(`/organizations/${orgId}/ecosystem`);
export const addEcosystemLink = (orgId: number, body: Record<string, unknown>) =>
  post<EcosystemLink>(`/organizations/${orgId}/ecosystem`, body);
export const removeEcosystemLink = (orgId: number, linkId: number) =>
  del(`/organizations/${orgId}/ecosystem?linkId=${linkId}`);

// Organization sectors (multi-select)
export const fetchOrganizationSectors = (orgId: number) =>
  get<{ IndustrySectorID: number; SectorName: string }[]>(`/organizations/${orgId}/sectors`);
export const setOrganizationSectors = (orgId: number, sectorIds: number[]) =>
  put<void>(`/organizations/${orgId}/sectors`, { sectorIds });

// Partnership maturity history
export const fetchMaturityHistory = (orgId: number) =>
  get<(PartnershipStageHistoryEntry & { OldStageName?: string; NewStageName: string })[]>(
    `/organizations/${orgId}/maturity-history`
  );
export const addMaturityTransition = (orgId: number, body: Record<string, unknown>) =>
  post<PartnershipStageHistoryEntry>(`/organizations/${orgId}/maturity-history`, body);

// Contact interest areas (multi-select)
export const fetchContactInterests = (contactId: number) =>
  get<{ InterestAreaID: number; AreaName: string }[]>(`/contacts/${contactId}/interests`);
export const setContactInterests = (contactId: number, interestAreaIds: number[]) =>
  put<void>(`/contacts/${contactId}/interests`, { interestAreaIds });

// Segments
export const fetchSegments = (entityType?: 'O' | 'C') => {
  const q = entityType ? `?entityType=${entityType}` : '';
  return get<SegmentDefinition[]>(`/segments${q}`);
};
export const fetchSegment = (id: number) => get<SegmentDefinition>(`/segments/${id}`);
export const createSegment = (body: Record<string, unknown>) => post<SegmentDefinition>('/segments', body);
export const updateSegment = (id: number, body: Record<string, unknown>) => put<SegmentDefinition>(`/segments/${id}`, body);
export const deleteSegment = (id: number) => del(`/segments/${id}`);
export const previewSegment = (body: Record<string, unknown>) =>
  post<{ count: number }>('/segments/preview', body);
export const executeSegment = (body: Record<string, unknown>) =>
  post<Record<string, unknown>[]>('/segments/execute', body);

// Lookup resolver — caches fetched lookup tables for use in resolving IDs to names
const lookupCache: Record<string, LookupItem[]> = {};

export async function loadLookup(table: string): Promise<LookupItem[]> {
  if (lookupCache[table]) return lookupCache[table];
  const items = await fetchLookup(table);
  lookupCache[table] = items;
  return items;
}

export function resolveName(items: LookupItem[], id?: number | null): string {
  if (id == null) return '—';
  return items.find(i => i.id === id)?.name ?? '—';
}
