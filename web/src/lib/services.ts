// Service layer — swap mock imports for API calls to integrate with Azure SQL

import type {
  Organization,
  Contact,
  Faculty,
  EngagementEvent,
  Opportunity,
  OrganizationScore,
  OrganizationFacultyLinkage,
  OrganizationGovernmentAlignment,
  OrganizationStrategicTag,
  LookupTable,
  LookupItem,
} from '@/types';

import {
  organizations,
  contacts,
  faculty,
  engagementEvents,
  opportunities,
  organizationScores,
  organizationFacultyLinkages as facultyLinkages,
  organizationGovernmentAlignments as governmentAlignments,
  organizationStrategicTags as strategicTags,
} from '@/data/mock';

import { getLookup, lookupName } from '@/data/lookups';

// ---------------------------------------------------------------------------
// Organization services
// ---------------------------------------------------------------------------

export function getOrganizations(): Organization[] {
  return organizations;
}

export function getOrganization(id: number): Organization | undefined {
  return organizations.find((o) => o.OrganizationID === id);
}

export function getOrganizationContacts(orgId: number): Contact[] {
  return contacts.filter((c) => c.OrganizationID === orgId);
}

export function getOrganizationEvents(orgId: number): EngagementEvent[] {
  return engagementEvents.filter((e) => e.OrganizationID === orgId);
}

export function getOrganizationOpportunities(orgId: number): Opportunity[] {
  return opportunities.filter((o) => o.OrganizationID === orgId);
}

export function getOrganizationScore(orgId: number): OrganizationScore | undefined {
  return organizationScores.find((s) => s.OrganizationID === orgId);
}

export function getOrganizationTags(orgId: number): { tag: LookupItem; notes?: string }[] {
  const tagLookup = getLookup('strategicTags');
  return strategicTags
    .filter((t) => t.OrganizationID === orgId)
    .map((t) => ({
      tag: tagLookup.find((l) => l.id === t.StrategicTagID) ?? { id: t.StrategicTagID, name: '—' },
    }));
}

export function getOrganizationAlignments(orgId: number): { alignment: LookupItem; notes?: string }[] {
  const alignLookup = getLookup('governmentAlignmentTypes');
  return governmentAlignments
    .filter((a) => a.OrganizationID === orgId)
    .map((a) => ({
      alignment: alignLookup.find((l) => l.id === a.GovernmentAlignmentTypeID) ?? {
        id: a.GovernmentAlignmentTypeID,
        name: '—',
      },
      notes: a.Notes,
    }));
}

export function getOrganizationFacultyLinkages(
  orgId: number,
): { linkage: OrganizationFacultyLinkage; faculty: Faculty | undefined; roleName: string }[] {
  return facultyLinkages
    .filter((l) => l.OrganizationID === orgId)
    .map((l) => ({
      linkage: l,
      faculty: faculty.find((f) => f.FacultyID === l.FacultyID),
      roleName: lookupName('linkageRoles', l.LinkageRoleID),
    }));
}

// ---------------------------------------------------------------------------
// Contact services
// ---------------------------------------------------------------------------

export function getContacts(): Contact[] {
  return contacts;
}

export function getContact(id: number): Contact | undefined {
  return contacts.find((c) => c.ContactID === id);
}

// ---------------------------------------------------------------------------
// Faculty services
// ---------------------------------------------------------------------------

export function getFaculty(): Faculty[] {
  return faculty;
}

export function getFacultyMember(id: number): Faculty | undefined {
  return faculty.find((f) => f.FacultyID === id);
}

export function getFacultyLinkages(
  facultyId: number,
): { linkage: OrganizationFacultyLinkage; orgName: string; roleName: string }[] {
  return facultyLinkages
    .filter((l) => l.FacultyID === facultyId)
    .map((l) => ({
      linkage: l,
      orgName: organizations.find((o) => o.OrganizationID === l.OrganizationID)?.OrganizationName ?? '—',
      roleName: lookupName('linkageRoles', l.LinkageRoleID),
    }));
}

// ---------------------------------------------------------------------------
// Event services
// ---------------------------------------------------------------------------

export function getEngagementEvents(): EngagementEvent[] {
  return engagementEvents;
}

export function getEngagementEvent(id: number): EngagementEvent | undefined {
  return engagementEvents.find((e) => e.EngagementEventID === id);
}

export function getUpcomingFollowUps(): (EngagementEvent & { orgName: string; contactName: string })[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return engagementEvents
    .filter((e) => {
      if (!e.NextStepDate) return false;
      const fDate = new Date(e.NextStepDate);
      return fDate >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(a.NextStepDate!).getTime() - new Date(b.NextStepDate!).getTime())
    .map((e) => {
      const org = organizations.find((o) => o.OrganizationID === e.OrganizationID);
      const contact = contacts.find((c) => c.ContactID === e.PrimaryContactID);
      return {
        ...e,
        orgName: org?.OrganizationName ?? '—',
        contactName: contact ? `${contact.FirstName} ${contact.LastName}` : '—',
      };
    });
}

export function getStaleEngagements(
  daysSince: number,
): { org: Organization; lastEvent: EngagementEvent; daysSinceEngagement: number }[] {
  const now = new Date();
  const threshold = daysSince * 24 * 60 * 60 * 1000;

  const orgLastEvent = new Map<number, EngagementEvent>();
  for (const e of engagementEvents) {
    const existing = orgLastEvent.get(e.OrganizationID);
    if (!existing || new Date(e.EventDate) > new Date(existing.EventDate)) {
      orgLastEvent.set(e.OrganizationID, e);
    }
  }

  const results: { org: Organization; lastEvent: EngagementEvent; daysSinceEngagement: number }[] = [];
  for (const org of organizations) {
    const lastEvent = orgLastEvent.get(org.OrganizationID);
    if (!lastEvent) continue;
    const gap = now.getTime() - new Date(lastEvent.EventDate).getTime();
    if (gap >= threshold) {
      results.push({ org, lastEvent, daysSinceEngagement: Math.floor(gap / (24 * 60 * 60 * 1000)) });
    }
  }

  return results.sort((a, b) => b.daysSinceEngagement - a.daysSinceEngagement);
}

// ---------------------------------------------------------------------------
// Opportunity services
// ---------------------------------------------------------------------------

export function getOpportunities(): Opportunity[] {
  return opportunities;
}

export function getOpportunitiesByStage(): Record<number, Opportunity[]> {
  const grouped: Record<number, Opportunity[]> = {};
  for (const opp of opportunities) {
    const stage = opp.StageID ?? 0;
    (grouped[stage] ??= []).push(opp);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Score services
// ---------------------------------------------------------------------------

export function getScores(): OrganizationScore[] {
  return organizationScores;
}

export function getScoresRanked(): (OrganizationScore & { orgName: string })[] {
  return [...organizationScores]
    .sort((a, b) => b.OverallPartnershipScore - a.OverallPartnershipScore)
    .map((s) => ({
      ...s,
      orgName: organizations.find((o) => o.OrganizationID === s.OrganizationID)?.OrganizationName ?? '—',
    }));
}

// ---------------------------------------------------------------------------
// Lookup services
// ---------------------------------------------------------------------------

export function getLookupItems(table: LookupTable): LookupItem[] {
  return getLookup(table);
}

export function resolveLookup(table: LookupTable, id?: number): string {
  return lookupName(table, id);
}

// ---------------------------------------------------------------------------
// Dashboard aggregate services
// ---------------------------------------------------------------------------

export function getDashboardStats(): {
  totalOrgs: number;
  activeOpps: number;
  recentEvents: number;
  avgScore: number;
  staleDays90: number;
  totalContacts: number;
} {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeOpps = opportunities.filter(
    (o) => o.StatusID === 1 || (!o.StatusID && !o.ClosedDate),
  ).length;

  const recentEvents = engagementEvents.filter(
    (e) => new Date(e.EventDate) >= thirtyDaysAgo,
  ).length;

  const scores = organizationScores.map((s) => s.OverallPartnershipScore);
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 100) / 100
      : 0;

  const staleDays90 = getStaleEngagements(90).length;

  return {
    totalOrgs: organizations.length,
    activeOpps,
    recentEvents,
    avgScore,
    staleDays90,
    totalContacts: contacts.length,
  };
}
