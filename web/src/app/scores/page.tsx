'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchScoresRanked, updateOrganizationScore } from '@/lib/api';
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchScoresRanked()
      .then(data => setScores(data))
      .catch(e => console.error('Failed to load scores', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

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
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, idx) => {
                const badge = getScoreBadge(row.OverallPartnershipScore);
                const isExpanded = expandedId === row.OrganizationScoreID;
                const isEditing = editingId === row.OrganizationScoreID;
                return (
                  <ScoreRow
                    key={row.OrganizationScoreID}
                    row={row}
                    rank={idx + 1}
                    badge={badge}
                    isExpanded={isExpanded || isEditing}
                    isEditing={isEditing}
                    onToggle={() => { if (!isEditing) setExpandedId(isExpanded ? null : row.OrganizationScoreID); }}
                    onEdit={() => { setEditingId(row.OrganizationScoreID); setExpandedId(row.OrganizationScoreID); }}
                    onSaved={() => { setEditingId(null); reload(); setToast('Scores updated'); }}
                    onCancelEdit={() => setEditingId(null)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ row, rank, badge, isExpanded, isEditing, onToggle, onEdit, onSaved, onCancelEdit }: {
  row: ScoredOrg;
  rank: number;
  badge: { label: string; color: string };
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    const f: Record<string, string> = {};
    for (const s of SUB_SCORES) f[s.key] = String((row[s.key as keyof typeof row] as number) ?? 0);
    f.Notes = (row.Notes as string) ?? '';
    setForm(f);
    onEdit();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      for (const s of SUB_SCORES) {
        const v = parseFloat(form[s.key] || '0');
        body[s.key] = isNaN(v) ? 0 : Math.min(5, Math.max(0, v));
      }
      body.Notes = form.Notes || null;
      await updateOrganizationScore(row.OrganizationID, body);
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save scores');
    }
    setSaving(false);
  }

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
        <td className="px-4 py-3">
          <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(); }}
            className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
            Edit
          </button>
        </td>
      </tr>
      {isExpanded && !isEditing && (
        <tr>
          <td colSpan={5 + SUB_SCORES.length} className="bg-gray-50/50 px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              {SUB_SCORES.map(s => (
                <ScoreBar key={s.key} label={s.label} value={(row[s.key as keyof typeof row] as number) ?? 0} max={5} />
              ))}
            </div>
          </td>
        </tr>
      )}
      {isEditing && (
        <tr>
          <td colSpan={5 + SUB_SCORES.length} className="bg-indigo-50/40 px-6 py-5">
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Edit Scores — {row.OrganizationName}</h4>
                <div className="flex gap-2">
                  <button type="button" onClick={onCancelEdit} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUB_SCORES.map(s => (
                  <div key={s.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="0" max="5" step="0.1"
                        value={form[s.key] || '0'}
                        onChange={e => setForm(prev => ({ ...prev, [s.key]: e.target.value }))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <input
                        type="number" min="0" max="5" step="0.1"
                        value={form[s.key] || '0'}
                        onChange={e => setForm(prev => ({ ...prev, [s.key]: e.target.value }))}
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
                  onChange={e => setForm(prev => ({ ...prev, Notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
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
