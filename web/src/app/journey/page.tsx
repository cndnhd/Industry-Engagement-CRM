'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { JourneyLog, Organization, LookupItem } from '@/types';
import {
  fetchJourneyLogs,
  createJourneyLog,
  fetchOrganizations,
  loadLookup,
  resolveName,
} from '@/lib/api';
import { EnhancedDataGrid, type GridColumn } from '@/components/grid';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import Badge from '@/components/ui/Badge';

type JourneyRow = JourneyLog & { JourneyStageName?: string; OrganizationName?: string };

export default function JourneyPage() {
  const [logs, setLogs] = useState<JourneyRow[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [journeyStages, setJourneyStages] = useState<LookupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const reload = useCallback(async () => {
    try {
      const [jl, o, js] = await Promise.all([
        fetchJourneyLogs(),
        fetchOrganizations(),
        loadLookup('journeyStages'),
      ]);
      setLogs(jl);
      setOrgs(o);
      setJourneyStages(js);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load journey logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const orgMap = useMemo(
    () => new Map(orgs.map(o => [o.OrganizationID, o.OrganizationName])),
    [orgs],
  );

  const columns: GridColumn<JourneyRow>[] = useMemo(() => [
    {
      key: 'LogDate',
      header: 'Date',
      type: 'date',
      sortable: true,
      filterable: true,
      render: r => r.LogDate ? new Date(r.LogDate).toLocaleDateString() : '—',
      getValue: r => r.LogDate ?? '',
    },
    {
      key: 'Organization',
      header: 'Organization',
      type: 'lookup',
      sortable: true,
      searchable: true,
      filterable: true,
      filterOptions: [...new Set(logs.map(r => r.OrganizationName ?? orgMap.get(r.OrganizationID) ?? '').filter(Boolean))]
        .sort()
        .map(n => ({ value: n.toLowerCase(), label: n })),
      render: r => {
        const name = r.OrganizationName ?? orgMap.get(r.OrganizationID) ?? '—';
        return (
          <Link
            href={`/organizations/${r.OrganizationID}`}
            className="text-indigo-600 hover:text-indigo-800 hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {name}
          </Link>
        );
      },
      getValue: r => r.OrganizationName ?? orgMap.get(r.OrganizationID) ?? '',
    },
    {
      key: 'JourneyStage',
      header: 'Stage',
      type: 'lookup',
      sortable: true,
      filterable: true,
      filterOptions: journeyStages.map(s => ({ value: s.name.toLowerCase(), label: s.name })),
      render: r => r.JourneyStageName ?? resolveName(journeyStages, r.JourneyStageID),
      getValue: r => r.JourneyStageName ?? resolveName(journeyStages, r.JourneyStageID),
    },
    {
      key: 'EventType',
      header: 'Event Type',
      type: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      filterOptions: [...new Set(logs.map(r => r.EventType).filter(Boolean) as string[])]
        .sort()
        .map(v => ({ value: v.toLowerCase(), label: v })),
      render: r => r.EventType ?? '—',
      getValue: r => r.EventType ?? '',
    },
    {
      key: 'Outcome',
      header: 'Outcome',
      type: 'string',
      searchable: true,
      render: r => {
        const text = r.Outcome ?? '';
        return text.length > 80 ? `${text.slice(0, 80)}…` : text || '—';
      },
      getValue: r => r.Outcome ?? '',
    },
    {
      key: 'NextStep',
      header: 'Next Step',
      type: 'string',
      searchable: true,
      render: r => r.NextStep ?? '—',
      getValue: r => r.NextStep ?? '',
    },
    {
      key: 'NextStepDate',
      header: 'Next Step Date',
      type: 'date',
      sortable: true,
      filterable: true,
      render: r => {
        if (!r.NextStepDate) return '—';
        const formatted = new Date(r.NextStepDate).toLocaleDateString();
        if (new Date(r.NextStepDate) < new Date()) {
          return (
            <span className="inline-flex items-center gap-1.5">
              {formatted}
              <Badge label="Overdue" color="red" />
            </span>
          );
        }
        return formatted;
      },
      getValue: r => r.NextStepDate ?? '',
    },
    {
      key: 'Owner',
      header: 'Owner',
      type: 'string',
      sortable: true,
      searchable: true,
      filterable: true,
      filterOptions: [...new Set(logs.map(r => r.Owner).filter(Boolean) as string[])]
        .sort()
        .map(v => ({ value: v.toLowerCase(), label: v })),
      render: r => r.Owner ?? '—',
      getValue: r => r.Owner ?? '',
    },
    {
      key: 'Completed',
      header: 'Completed',
      type: 'lookup',
      filterable: true,
      filterOptions: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      render: r => (
        <Badge
          label={r.CompletedFlag ? 'Yes' : 'No'}
          color={r.CompletedFlag ? 'emerald' : 'slate'}
        />
      ),
      getValue: r => r.CompletedFlag ? 'yes' : 'no',
    },
    {
      key: 'Sentiment',
      header: 'Sentiment',
      type: 'string',
      sortable: true,
      filterable: true,
      defaultVisible: false,
      filterOptions: [...new Set(logs.map(r => r.Sentiment).filter(Boolean) as string[])]
        .sort()
        .map(v => ({ value: v.toLowerCase(), label: v })),
      render: r => r.Sentiment ?? '—',
      getValue: r => r.Sentiment ?? '',
    },
    {
      key: 'StrategicRelevance',
      header: 'Strategic Relevance',
      type: 'string',
      searchable: true,
      defaultVisible: false,
      render: r => {
        const text = r.StrategicRelevance ?? '';
        return text.length > 60 ? `${text.slice(0, 60)}…` : text || '—';
      },
      getValue: r => r.StrategicRelevance ?? '',
    },
  ], [logs, orgMap, journeyStages]);

  async function handleCreate() {
    setSaving(true);
    try {
      await createJourneyLog({
        OrganizationID: form.OrganizationID ? Number(form.OrganizationID) : undefined,
        JourneyStageID: form.JourneyStageID ? Number(form.JourneyStageID) : undefined,
        LogDate: form.LogDate || undefined,
        EventType: form.EventType || undefined,
        Outcome: form.Outcome || undefined,
        NextStep: form.NextStep || undefined,
        NextStepDate: form.NextStepDate || undefined,
        Owner: form.Owner || undefined,
        Notes: form.Notes || undefined,
        Summary: form.Summary || undefined,
      });
      setShowCreate(false);
      setForm({});
      setToast({ message: 'Journey entry created', type: 'success' });
      await reload();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to create entry', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journey Log"
        action={{ label: '+ New Journey Entry', onClick: () => setShowCreate(true) }}
      />

      <EnhancedDataGrid<JourneyRow>
        data={logs}
        columns={columns}
        entityName="Journey Logs"
        emptyMessage="No journey log entries found. Adjust filters or create a new entry."
      />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm({}); }} title="New Journey Entry" size="xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="Organization" required>
            {id => (
              <select id={id} className={selectClass} value={form.OrganizationID ?? ''} onChange={e => setForm(f => ({ ...f, OrganizationID: e.target.value }))}>
                <option value="">Select…</option>
                {orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Journey Stage" required>
            {id => (
              <select id={id} className={selectClass} value={form.JourneyStageID ?? ''} onChange={e => setForm(f => ({ ...f, JourneyStageID: e.target.value }))}>
                <option value="">Select…</option>
                {journeyStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Log Date" required>
            {id => <input id={id} type="date" className={inputClass} value={form.LogDate ?? ''} onChange={e => setForm(f => ({ ...f, LogDate: e.target.value }))} />}
          </FormField>
          <FormField label="Event Type">
            {id => <input id={id} className={inputClass} value={form.EventType ?? ''} onChange={e => setForm(f => ({ ...f, EventType: e.target.value }))} />}
          </FormField>
          <div className="col-span-2">
            <FormField label="Outcome">
              {id => <input id={id} className={inputClass} value={form.Outcome ?? ''} onChange={e => setForm(f => ({ ...f, Outcome: e.target.value }))} />}
            </FormField>
          </div>
          <FormField label="Next Step">
            {id => <input id={id} className={inputClass} value={form.NextStep ?? ''} onChange={e => setForm(f => ({ ...f, NextStep: e.target.value }))} />}
          </FormField>
          <FormField label="Next Step Date">
            {id => <input id={id} type="date" className={inputClass} value={form.NextStepDate ?? ''} onChange={e => setForm(f => ({ ...f, NextStepDate: e.target.value }))} />}
          </FormField>
          <div className="col-span-2">
            <FormField label="Owner">
              {id => <input id={id} className={inputClass} value={form.Owner ?? ''} onChange={e => setForm(f => ({ ...f, Owner: e.target.value }))} />}
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Notes">
              {id => <textarea id={id} rows={3} className={inputClass} value={form.Notes ?? ''} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} />}
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Summary">
              {id => <textarea id={id} rows={2} className={inputClass} value={form.Summary ?? ''} onChange={e => setForm(f => ({ ...f, Summary: e.target.value }))} />}
            </FormField>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowCreate(false); setForm({}); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.OrganizationID || !form.JourneyStageID || !form.LogDate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Create Entry'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
