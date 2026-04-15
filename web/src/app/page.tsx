'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboardStats, fetchScoresRanked, fetchEngagementEvents, fetchOrganizations } from '@/lib/api';
import type { Organization, EngagementEvent, OrganizationScore } from '@/types';
import { getScoreBadge } from '@/types';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';

type DashboardStats = {
  totalOrgs: number;
  totalContacts: number;
  activeOpps: number;
  recentEvents: number;
  avgScore: number;
};

type RankedScore = OrganizationScore & { OrganizationName: string };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topOrgs, setTopOrgs] = useState<RankedScore[]>([]);
  const [recentEvents, setRecentEvents] = useState<EngagementEvent[]>([]);
  const [orgMap, setOrgMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, scores, events, orgs] = await Promise.all([
          fetchDashboardStats(),
          fetchScoresRanked(),
          fetchEngagementEvents(),
          fetchOrganizations(),
        ]);

        setStats(s);
        setTopOrgs(scores.slice(0, 8));

        const map: Record<number, string> = {};
        orgs.forEach((o: Organization) => { map[o.OrganizationID] = o.OrganizationName; });
        setOrgMap(map);

        const sorted = [...events].sort(
          (a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime()
        );
        setRecentEvents(sorted.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Organizations" value={stats?.totalOrgs ?? 0} />
        <StatCard title="Total Contacts" value={stats?.totalContacts ?? 0} />
        <StatCard title="Active Opportunities" value={stats?.activeOpps ?? 0} />
        <StatCard title="Recent Events (30d)" value={stats?.recentEvents ?? 0} />
        <StatCard title="Avg Partnership Score" value={stats?.avgScore ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Organizations */}
        <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Organizations by Score</h2>
          {topOrgs.length === 0 ? (
            <p className="text-sm text-gray-400">No scored organizations yet.</p>
          ) : (
            <div className="space-y-3">
              {topOrgs.map((org, i) => {
                const badge = getScoreBadge(org.OverallPartnershipScore);
                return (
                  <div key={org.OrganizationID} className="flex items-center gap-3">
                    <span className="w-6 text-right text-xs font-medium text-gray-400">{i + 1}</span>
                    <Link
                      href={`/organizations/${org.OrganizationID}`}
                      className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                    >
                      {org.OrganizationName}
                    </Link>
                    <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                      {org.OverallPartnershipScore}
                    </span>
                    <Badge label={badge.label} color={badge.color as React.ComponentProps<typeof Badge>['color']} size="sm" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Engagements */}
        <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Engagements</h2>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No recent engagements.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentEvents.map((ev) => (
                <div key={ev.EngagementEventID} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.Subject ?? '—'}</p>
                    <p className="text-xs text-gray-500">{orgMap[ev.OrganizationID] ?? 'Unknown Org'}</p>
                  </div>
                  <span className="ml-4 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(ev.EventDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
