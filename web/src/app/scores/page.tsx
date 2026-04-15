'use client';

import { useState, useEffect } from 'react';
import { fetchScoresRanked } from '@/lib/api';
import type { OrganizationScore } from '@/types';
import { getScoreBadge } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import ScoreBar from '@/components/ui/ScoreBar';

type ScoredOrg = OrganizationScore & { OrganizationName: string };

type SortKey = 'rank' | 'OverallPartnershipScore' | 'ExecutiveEngagementScore' | 'MultiTouchpointScore' | 'FacultyAlignmentScore' | 'GovernmentOverlayScore' | 'AdvisoryBoardScore' | 'PhilanthropicBehaviorScore' | 'RegionalIdentityScore';

const SUB_SCORES: { key: keyof OrganizationScore; label: string; short: string }[] = [
  { key: 'ExecutiveEngagementScore', label: 'Executive Engagement', short: 'Exec' },
  { key: 'MultiTouchpointScore', label: 'Multi-Touchpoint', short: 'Multi' },
  { key: 'FacultyAlignmentScore', label: 'Faculty Alignment', short: 'Faculty' },
  { key: 'GovernmentOverlayScore', label: 'Government Overlay', short: 'Gov' },
  { key: 'AdvisoryBoardScore', label: 'Advisory Board', short: 'Advisory' },
  { key: 'PhilanthropicBehaviorScore', label: 'Philanthropic Behavior', short: 'Philanthropy' },
  { key: 'RegionalIdentityScore', label: 'Regional Identity', short: 'Regional' },
];

export default function ScoresPage() {
  const [scores, setScores] = useState<ScoredOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchScoresRanked()
      .then(data => setScores(data))
      .catch(e => console.error('Failed to load scores', e))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...scores].sort((a, b) => {
    if (sortKey === 'rank') return 0;
    const av = (a[sortKey as keyof ScoredOrg] as number) ?? 0;
    const bv = (b[sortKey as keyof ScoredOrg] as number) ?? 0;
    return sortAsc ? av - bv : bv - av;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const badgeCounts = scores.reduce<Record<string, number>>((acc, s) => {
    const badge = getScoreBadge(s.OverallPartnershipScore);
    acc[badge.label] = (acc[badge.label] ?? 0) + 1;
    return acc;
  }, {});

  const categories: { label: string; color: BadgeColor }[] = [
    { label: 'High Potential', color: 'emerald' },
    { label: 'Promising', color: 'blue' },
    { label: 'Emerging', color: 'amber' },
    { label: 'Low', color: 'slate' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Partnership Scores" />
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading scores…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Partnership Scores" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map(c => (
          <StatCard key={c.label} title={c.label} value={badgeCounts[c.label] ?? 0} subtitle="organizations" />
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
        <p className="text-sm text-gray-500 leading-relaxed">
          Scores are computed as a weighted sum of 7 sub-factors (max 5 each): Executive Engagement (25%), Multi-Touchpoint (20%), Faculty Alignment (15%), Government Overlay (10%), Advisory Board (10%), Philanthropic Behavior (10%), Regional Identity (10%). The overall score is normalized to 0–100.
        </p>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortHeader label="#" sortKey="rank" current={sortKey} asc={sortAsc} onClick={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Organization</th>
                <SortHeader label="Overall" sortKey="OverallPartnershipScore" current={sortKey} asc={sortAsc} onClick={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Badge</th>
                {SUB_SCORES.map(s => (
                  <SortHeader key={s.key} label={s.short} sortKey={s.key as SortKey} current={sortKey} asc={sortAsc} onClick={handleSort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, idx) => {
                const badge = getScoreBadge(row.OverallPartnershipScore);
                const isExpanded = expandedId === row.OrganizationScoreID;
                return (
                  <ScoreRow
                    key={row.OrganizationScoreID}
                    row={row}
                    rank={idx + 1}
                    badge={badge}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : row.OrganizationScoreID)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ row, rank, badge, isExpanded, onToggle }: {
  row: ScoredOrg;
  rank: number;
  badge: { label: string; color: string };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
        <td className="px-4 py-3 text-gray-400 font-medium">{rank}</td>
        <td className="px-4 py-3 font-medium text-indigo-600">{row.OrganizationName}</td>
        <td className="px-4 py-3 font-bold text-gray-900">{row.OverallPartnershipScore}</td>
        <td className="px-4 py-3"><Badge label={badge.label} color={badge.color as BadgeColor} /></td>
        {SUB_SCORES.map(s => (
          <td key={s.key} className="px-4 py-3 text-gray-600">{(row[s.key as keyof typeof row] as number) ?? 0}</td>
        ))}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4 + SUB_SCORES.length} className="bg-gray-50/50 px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              {SUB_SCORES.map(s => (
                <ScoreBar key={s.key} label={s.label} value={(row[s.key as keyof typeof row] as number) ?? 0} max={5} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SortHeader({ label, sortKey, current, asc, onClick }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
    >
      {label}
      {active && <span className="ml-1">{asc ? '↑' : '↓'}</span>}
    </th>
  );
}
