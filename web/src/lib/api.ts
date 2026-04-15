// API client — all data comes from Azure SQL via Next.js API routes.
// No mock data fallbacks.

import type { Organization, Contact, Faculty, EngagementEvent, Opportunity, OrganizationScore, LookupItem } from '@/types';

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
export const fetchOrganizationTags = (id: number) =>
  get<{ id: number; name: string; Notes?: string }[]>(`/organizations/${id}/tags`)
    .then(rows => rows.map(r => ({ tag: { id: r.id, name: r.name }, notes: r.Notes })));
export const fetchOrganizationAlignments = (id: number) =>
  get<{ id: number; name: string; Notes?: string }[]>(`/organizations/${id}/alignments`)
    .then(rows => rows.map(r => ({ alignment: { id: r.id, name: r.name }, notes: r.Notes })));
export const fetchOrganizationFacultyLinkages = (id: number) =>
  get<Record<string, unknown>[]>(`/organizations/${id}/faculty-linkages`);

// Contacts
export const fetchContacts = () => get<Contact[]>('/contacts');
export const createContact = (body: Record<string, unknown>) => post<Contact>('/contacts', body);
export const updateContact = (id: number, body: Record<string, unknown>) => put<Contact>(`/contacts/${id}`, body);
export const deleteContact = (id: number) => del(`/contacts/${id}`);

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
export const fetchDashboardStats = () =>
  get<{ totalOrgs: number; totalContacts: number; activeOpps: number; recentEvents: number; avgScore: number }>('/dashboard');

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
