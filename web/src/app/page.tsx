'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchDashboardStats,
  fetchScoresRanked,
  fetchEngagementEvents,
  fetchOrganizations,
} from '@/lib/api';
import type {
  DashboardResponse,
  TagDistribution,
  MaturityDistribution,
  OverdueFollowUp,
  DashboardStats,
  RecentJourneyLog,
  ActivityDistribution,
} from '@/lib/api';
import type { Organization, EngagementEvent, OrganizationScore } from '@/types';
import { getScoreBadge } from '@/types';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';

type RankedScore = OrganizationScore & { OrganizationName: string };

const MATURITY_COLORS: Record<number, string> = {
  0: 'bg-slate-400',
  1: 'bg-slate-500',
  2: 'bg-blue-400',
  3: 'bg-blue-500',
  4: 'bg-emerald-400',
  5: 'bg-emerald-500',
};

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function TagDistributionChart({ tags }: { tags: TagDistribution[] }) {
  if (tags.length === 0) {
    return <p className="text-sm text-gray-400">No strategic tags assigned yet.</p>;
  }
  const max = Math.max(...tags.map((t) => t.orgCount));
  const palette = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500',
  ];
  return (
    <div className="space-y-2.5">
      {tags.map((t, i) => (
        <div key={t.tagName} className="flex items-center gap-3">
          <span className="w-28 text-sm text-gray-700 truncate text-right flex-shrink-0">
            {t.tagName}
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${palette[i % palette.length]} transition-all`}
              style={{ width: `${Math.max((t.orgCount / max) * 100, 4)}%` }}
            />
          </div>
          <span className="w-8 text-sm font-medium text-gray-900 text-right">{t.orgCount}</span>
        </div>
      ))}
    </div>
  );
}

function MaturityFunnel({ stages }: { stages: MaturityDistribution[] }) {
  if (stages.length === 0) {
    return <p className="text-sm text-gray-400">No maturity stages defined.</p>;
  }
  const max = Math.max(...stages.map((s) => s.orgCount), 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.stageLevel} className="flex items-center gap-3">
          <span className="w-36 text-sm text-gray-700 truncate text-right flex-shrink-0">
            <span className="font-medium text-gray-400 mr-1">L{s.stageLevel}</span>
            {s.stageName}
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${MATURITY_COLORS[s.stageLevel] ?? 'bg-gray-400'} transition-all`}
              style={{ width: `${Math.max((s.orgCount / max) * 100, 4)}%` }}
            />
          </div>
          <span className="w-8 text-sm font-medium text-gray-900 text-right">{s.orgCount}</span>
        </div>
      ))}
    </div>
  );
}

function OverdueTable({ rows }: { rows: OverdueFollowUp[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Overdue Follow-Ups</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="pb-2 pr-4">Organization</th>
              <th className="pb-2 pr-4">Next Action</th>
              <th className="pb-2 pr-4">Owner</th>
              <th className="pb-2 text-right">Days Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => {
              const overdue = daysAgo(r.NextActionDate);
              return (
                <tr key={r.OrganizationID}>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/organizations/${r.OrganizationID}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {r.OrganizationName}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {new Date(r.NextActionDate).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{r.AssignedOwner ?? '—'}</td>
                  <td className={`py-2.5 text-right font-medium ${overdue > 30 ? 'text-red-600' : 'text-amber-600'}`}>
                    {overdue}d
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentJourneyTable({ rows }: { rows: RecentJourneyLog[] }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Journey Entries</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No recent journey entries.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-2 pr-4">Organization</th>
                <th className="pb-2 pr-4">Stage</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Event Type</th>
                <th className="pb-2 pr-4">Outcome</th>
                <th className="pb-2">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.JourneyLogID}>
                  <td className="py-2.5 pr-4 font-medium text-gray-900">{r.OrganizationName ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{r.JourneyStageName ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {r.LogDate ? new Date(r.LogDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{r.EventType ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{r.Outcome ?? '—'}</td>
                  <td className="py-2.5 text-gray-600">{r.Owner ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActivityDistributionChart({ data }: { data: ActivityDistribution[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No activity data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.eventType} className="flex items-center gap-3">
          <span className="w-28 text-sm text-gray-700 truncate text-right flex-shrink-0">
            {d.eventType}
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }}
            />
          </div>
          <span className="w-8 text-sm font-medium text-gray-900 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function DormantAlert({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
      <span className="mt-0.5 text-amber-500">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {count} dormant relationship{count !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-amber-700 mt-0.5">
          Organizations with no meaningful engagement in 120+ days.{' '}
          <Link href="/segments" className="underline font-medium hover:text-amber-900">
            View in Segments
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tagDistribution, setTagDistribution] = useState<TagDistribution[]>([]);
  const [maturityDistribution, setMaturityDistribution] = useState<MaturityDistribution[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<OverdueFollowUp[]>([]);
  const [recentJourneyLogs, setRecentJourneyLogs] = useState<RecentJourneyLog[]>([]);
  const [activityDistribution, setActivityDistribution] = useState<ActivityDistribution[]>([]);
  const [topOrgs, setTopOrgs] = useState<RankedScore[]>([]);
  const [recentEvents, setRecentEvents] = useState<EngagementEvent[]>([]);
  const [orgMap, setOrgMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, scores, events, orgs] = await Promise.all([
          fetchDashboardStats(),
          fetchScoresRanked(),
          fetchEngagementEvents(),
          fetchOrganizations(),
        ]);

        setStats(dashboard.stats);
        setTagDistribution(dashboard.tagDistribution);
        setMaturityDistribution(dashboard.maturityDistribution);
        setOverdueFollowUps(dashboard.overdueFollowUps);
        setRecentJourneyLogs(dashboard.recentJourneyLogs);
        setActivityDistribution(dashboard.activityDistribution);
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

      {/* Core stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Organizations" value={stats?.totalOrgs ?? 0} />
        <StatCard title="Total Contacts" value={stats?.totalContacts ?? 0} />
        <StatCard title="Active Opportunities" value={stats?.activeOpps ?? 0} />
        <StatCard title="Recent Events (30d)" value={stats?.recentEvents ?? 0} />
        <StatCard title="Avg Partnership Score" value={stats?.avgScore ?? 0} />
      </div>

      {/* Strategic stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-amber-200 border-l-4 border-amber-400">
          <p className="text-sm font-medium text-amber-700">Dormant Orgs</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-900">
            {stats?.dormantOrgs ?? 0}
          </p>
          <p className="mt-1 text-xs text-amber-600">No engagement in 120+ days</p>
        </div>
        <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${(stats?.overdueActions ?? 0) > 0 ? 'ring-red-200 border-l-4 border-red-400' : 'ring-gray-950/5'}`}>
          <p className={`text-sm font-medium ${(stats?.overdueActions ?? 0) > 0 ? 'text-red-700' : 'text-gray-500'}`}>
            Overdue Actions
          </p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight ${(stats?.overdueActions ?? 0) > 0 ? 'text-red-900' : 'text-gray-900'}`}>
            {stats?.overdueActions ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-500">Past due follow-ups</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-blue-200 border-l-4 border-blue-400">
          <p className="text-sm font-medium text-blue-700">Upcoming Actions</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-900">
            {stats?.upcomingActions ?? 0}
          </p>
          <p className="mt-1 text-xs text-blue-600">Due within 14 days</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm font-medium text-gray-500">Journey Entries (30d)</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {stats?.recentJourneyEntries ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {stats?.savedSegments ?? 0} saved segment{(stats?.savedSegments ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Dormant alert */}
      <DormantAlert count={stats?.dormantOrgs ?? 0} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Strategic Tag Distribution</h2>
          <TagDistributionChart tags={tagDistribution} />
        </div>

        <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Maturity Funnel</h2>
          <MaturityFunnel stages={maturityDistribution} />
        </div>
      </div>

      {/* Activity distribution chart */}
      <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Activity Distribution</h2>
        <ActivityDistributionChart data={activityDistribution} />
      </div>

      {/* Overdue follow-ups table */}
      <OverdueTable rows={overdueFollowUps} />

      {/* Recent journey entries table */}
      <RecentJourneyTable rows={recentJourneyLogs} />

      {/* Existing panels */}
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
