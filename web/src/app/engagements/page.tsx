'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EngagementEvent, Organization, Contact, LookupItem } from '@/types';
import {
  fetchEngagementEvents,
  createEngagement,
  updateEngagement,
  deleteEngagement,
  fetchOrganizations,
  fetchContacts,
  loadLookup,
  resolveName,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type RollupAggregate, type ImportConfig } from '@/components/grid';

export default function EngagementsPage() {
  const [events, setEvents] = useState<EngagementEvent[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [engagementTypes, setEngagementTypes] = useState<LookupItem[]>([]);
  const [outreachMotions, setOutreachMotions] = useState<LookupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EngagementEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const reload = useCallback(async () => {
    try {
      const [ev, o, c, et, om] = await Promise.all([
        fetchEngagementEvents(),
        fetchOrganizations(),
        fetchContacts(),
        loadLookup('engagementTypes'),
        loadLookup('outreachMotions'),
      ]);
      setEvents(ev);
      setOrgs(o);
      setContacts(c);
      setEngagementTypes(et);
      setOutreachMotions(om);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load engagement events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const orgMap = useMemo(
    () => new Map(orgs.map(o => [o.OrganizationID, o.OrganizationName])),
    [orgs],
  );

  const contactMap = useMemo(
    () => new Map(contacts.map(c => [c.ContactID, `${c.FirstName} ${c.LastName}`])),
    [contacts],
  );

  function isOverdue(dateStr?: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  // ── Grid column definitions ──────────────────────────────────────────
  const columns: GridColumn<EngagementEvent>[] = useMemo(() => [
    {
      key: 'Subject',
      header: 'Subject',
      type: 'string',
      sortable: true,
      searchable: true,
      filterable: true,
      render: e => <span className="font-medium text-gray-900">{e.Subject ?? '—'}</span>,
      getValue: e => e.Subject ?? '',
    },
    {
      key: 'Organization',
      header: 'Organization',
      type: 'lookup',
      sortable: true,
      searchable: true,
      filterable: true,
      filterOptions: [...new Set(events.map(e => orgMap.get(e.OrganizationID) ?? '').filter(Boolean))]
        .sort()
        .map(n => ({ value: n.toLowerCase(), label: n })),
      render: e => orgMap.get(e.OrganizationID) ?? '—',
      getValue: e => orgMap.get(e.OrganizationID) ?? '',
    },
    {
      key: 'PrimaryContact',
      header: 'Primary Contact',
      type: 'string',
      sortable: true,
      searchable: true,
      defaultVisible: false,
      render: e => contactMap.get(e.PrimaryContactID!) ?? '—',
      getValue: e => contactMap.get(e.PrimaryContactID!) ?? '',
    },
    {
      key: 'EventDate',
      header: 'Date',
      type: 'date',
      sortable: true,
      filterable: true,
      render: e => e.EventDate ? new Date(e.EventDate).toLocaleDateString() : '—',
      getValue: e => e.EventDate ?? '',
    },
    {
      key: 'EngagementType',
      header: 'Type',
      type: 'lookup',
      filterable: true,
      filterOptions: engagementTypes.map(t => ({ value: t.name.toLowerCase(), label: t.name })),
      render: e => resolveName(engagementTypes, e.EngagementTypeID),
      getValue: e => resolveName(engagementTypes, e.EngagementTypeID),
    },
    {
      key: 'OutreachMotion',
      header: 'Outreach',
      type: 'lookup',
      filterable: true,
      filterOptions: outreachMotions.map(m => ({ value: m.name.toLowerCase(), label: m.name })),
      render: e => resolveName(outreachMotions, e.OutreachMotionID),
      getValue: e => resolveName(outreachMotions, e.OutreachMotionID),
    },
    {
      key: 'Outcome',
      header: 'Outcome',
      type: 'string',
      searchable: true,
      defaultVisible: true,
      render: e => {
        const text = e.Outcome ?? '';
        return text.length > 80 ? `${text.slice(0, 80)}…` : text || '—';
      },
      getValue: e => e.Outcome ?? '',
    },
    {
      key: 'ResponseTimeDays',
      header: 'Response (days)',
      type: 'number',
      sortable: true,
      filterable: true,
      defaultVisible: false,
      render: e => e.ResponseTimeDays != null ? String(e.ResponseTimeDays) : '—',
      getValue: e => e.ResponseTimeDays ?? null,
      aggregatable: true,
      aggregateLabel: 'Avg Response',
    },
    {
      key: 'FollowUpCadenceDays',
      header: 'Follow-Up Cadence',
      type: 'number',
      sortable: true,
      defaultVisible: false,
      render: e => e.FollowUpCadenceDays != null ? String(e.FollowUpCadenceDays) : '—',
      getValue: e => e.FollowUpCadenceDays ?? null,
    },
    {
      key: 'NextStep',
      header: 'Next Step',
      type: 'string',
      searchable: true,
      defaultVisible: false,
      render: e => e.NextStep ?? '—',
      getValue: e => e.NextStep ?? '',
    },
    {
      key: 'NextStepDate',
      header: 'Next Step Date',
      type: 'date',
      sortable: true,
      filterable: true,
      render: e => {
        if (!e.NextStepDate) return '—';
        const formatted = new Date(e.NextStepDate).toLocaleDateString();
        if (isOverdue(e.NextStepDate)) {
          return (
            <span className="inline-flex items-center gap-1.5">
              {formatted}
              <Badge label="Overdue" color="red" />
            </span>
          );
        }
        return formatted;
      },
      getValue: e => e.NextStepDate ?? '',
    },
    {
      key: 'Notes',
      header: 'Notes',
      type: 'string',
      searchable: true,
      defaultVisible: false,
      render: e => {
        const text = e.Notes ?? '';
        return text.length > 60 ? `${text.slice(0, 60)}…` : text || '—';
      },
      getValue: e => e.Notes ?? '',
    },
  ], [events, orgMap, contactMap, engagementTypes, outreachMotions]);

  // ── Rollup dimensions ────────────────────────────────────────────────
  const rollupDimensions: RollupDimension[] = useMemo(() => [
    {
      key: 'org',
      label: 'Organization',
      getGroup: (item) => orgMap.get((item as EngagementEvent).OrganizationID) ?? '(none)',
    },
    {
      key: 'type',
      label: 'Engagement Type',
      getGroup: (item) => resolveName(engagementTypes, (item as EngagementEvent).EngagementTypeID),
    },
    {
      key: 'outreach',
      label: 'Outreach Motion',
      getGroup: (item) => resolveName(outreachMotions, (item as EngagementEvent).OutreachMotionID),
    },
    {
      key: 'month',
      label: 'Month',
      getGroup: (item) => {
        const d = (item as EngagementEvent).EventDate;
        if (!d) return '(no date)';
        return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      },
    },
  ], [orgMap, engagementTypes, outreachMotions]);

  const rollupAggregates: RollupAggregate[] = useMemo(() => [
    {
      key: 'avgResponse',
      label: 'Avg Response Days',
      type: 'average' as const,
      getValue: (item) => (item as EngagementEvent).ResponseTimeDays ?? 0,
    },
  ], []);

  // ── Import config ────────────────────────────────────────────────────
  const importConfig: ImportConfig = useMemo(() => ({
    expectedHeaders: [
      { csvHeader: 'Subject', fieldKey: 'Subject', required: true },
      { csvHeader: 'OrganizationName', fieldKey: 'OrganizationName' },
      { csvHeader: 'EventDate', fieldKey: 'EventDate', required: true },
      { csvHeader: 'EngagementType', fieldKey: 'EngagementType' },
      { csvHeader: 'OutreachMotion', fieldKey: 'OutreachMotion' },
      { csvHeader: 'Outcome', fieldKey: 'Outcome' },
      { csvHeader: 'Notes', fieldKey: 'Notes' },
      { csvHeader: 'NextStep', fieldKey: 'NextStep' },
      { csvHeader: 'NextStepDate', fieldKey: 'NextStepDate' },
    ],
    duplicatePolicy: 'skip' as const,
    validate: (row) => {
      if (row.EventDate && Number.isNaN(Date.parse(row.EventDate))) return 'Invalid EventDate format';
      return null;
    },
  }), []);

  async function handleImport(rows: Record<string, string>[]) {
    const orgNameMap = new Map(orgs.map(o => [o.OrganizationName.toLowerCase(), o.OrganizationID]));
    const typeNameMap = new Map(engagementTypes.map(t => [t.name.toLowerCase(), t.id]));
    const motionNameMap = new Map(outreachMotions.map(m => [m.name.toLowerCase(), m.id]));

    for (const row of rows) {
      const body: Record<string, unknown> = {
        Subject: row.Subject,
        EventDate: row.EventDate,
        Outcome: row.Outcome || undefined,
        Notes: row.Notes || undefined,
        NextStep: row.NextStep || undefined,
        NextStepDate: row.NextStepDate || undefined,
      };
      if (row.OrganizationName) {
        body.OrganizationID = orgNameMap.get(row.OrganizationName.toLowerCase());
      }
      if (row.EngagementType) {
        body.EngagementTypeID = typeNameMap.get(row.EngagementType.toLowerCase());
      }
      if (row.OutreachMotion) {
        body.OutreachMotionID = motionNameMap.get(row.OutreachMotion.toLowerCase());
      }
      await createEngagement(body);
    }
    await reload();
    setToast({ message: `${rows.length} engagement(s) imported`, type: 'success' });
  }

  // ── CRUD handlers (unchanged logic) ──────────────────────────────────
  async function handleCreate() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        Subject: form.Subject || undefined,
        OrganizationID: form.OrganizationID ? Number(form.OrganizationID) : undefined,
        PrimaryContactID: form.PrimaryContactID ? Number(form.PrimaryContactID) : undefined,
        EventDate: form.EventDate || undefined,
        EngagementTypeID: form.EngagementTypeID ? Number(form.EngagementTypeID) : undefined,
        OutreachMotionID: form.OutreachMotionID ? Number(form.OutreachMotionID) : undefined,
        Outcome: form.Outcome || undefined,
        NextStepDate: form.NextStepDate || undefined,
        NextStep: form.NextStep || undefined,
        Notes: form.Notes || undefined,
      };
      const created = await createEngagement(body);
      setEvents(prev => [...prev, created]);
      setShowCreate(false);
      setForm({});
      setToast({ message: 'Engagement created', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to create event', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(e: EngagementEvent) {
    setEditForm({
      Subject: e.Subject ?? '',
      OrganizationID: e.OrganizationID != null ? String(e.OrganizationID) : '',
      PrimaryContactID: e.PrimaryContactID != null ? String(e.PrimaryContactID) : '',
      EventDate: e.EventDate ? e.EventDate.slice(0, 10) : '',
      OutreachMotionID: e.OutreachMotionID != null ? String(e.OutreachMotionID) : '',
      EngagementTypeID: e.EngagementTypeID != null ? String(e.EngagementTypeID) : '',
      ResponseTimeDays: e.ResponseTimeDays != null ? String(e.ResponseTimeDays) : '',
      FollowUpCadenceDays: e.FollowUpCadenceDays != null ? String(e.FollowUpCadenceDays) : '',
      Outcome: e.Outcome ?? '',
      Notes: e.Notes ?? '',
      NextStep: e.NextStep ?? '',
      NextStepDate: e.NextStepDate ? e.NextStepDate.slice(0, 10) : '',
    });
    setEditing(true);
  }

  async function handleEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        Subject: editForm.Subject || undefined,
        OrganizationID: editForm.OrganizationID ? Number(editForm.OrganizationID) : undefined,
        PrimaryContactID: editForm.PrimaryContactID ? Number(editForm.PrimaryContactID) : undefined,
        EventDate: editForm.EventDate || undefined,
        EngagementTypeID: editForm.EngagementTypeID ? Number(editForm.EngagementTypeID) : undefined,
        OutreachMotionID: editForm.OutreachMotionID ? Number(editForm.OutreachMotionID) : undefined,
        ResponseTimeDays: editForm.ResponseTimeDays ? Number(editForm.ResponseTimeDays) : undefined,
        FollowUpCadenceDays: editForm.FollowUpCadenceDays ? Number(editForm.FollowUpCadenceDays) : undefined,
        Outcome: editForm.Outcome || undefined,
        Notes: editForm.Notes || undefined,
        NextStep: editForm.NextStep || undefined,
        NextStepDate: editForm.NextStepDate || undefined,
      };
      await updateEngagement(selected.EngagementEventID, body);
      await reload();
      setSelected(null);
      setEditing(false);
      setToast({ message: 'Engagement updated successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to update engagement', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm('Are you sure you want to delete this engagement event?')) return;
    setSaving(true);
    try {
      await deleteEngagement(selected.EngagementEventID);
      setEvents(prev => prev.filter(e => e.EngagementEventID !== selected.EngagementEventID));
      setSelected(null);
      setEditing(false);
      setToast({ message: 'Engagement deleted successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to delete engagement', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
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
      <PageHeader title="Engagement Events" action={{ label: '+ New Event', onClick: () => setShowCreate(true) }} />

      <EnhancedDataGrid<EngagementEvent>
        data={events}
        columns={columns}
        entityName="Engagements"
        onRowClick={item => setSelected(item)}
        emptyMessage="No engagement events found. Adjust filters or create a new event."
        rollupDimensions={rollupDimensions}
        rollupAggregates={rollupAggregates}
        importConfig={importConfig}
        onImport={handleImport}
        showImport={true}
        showRollup={true}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Detail / Edit Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setEditing(false); }} title={editing ? 'Edit Event' : 'Event Details'} size="xl">
        {selected && !editing && (
          <>
            <div className="mb-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => startEdit(selected)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Detail label="Subject" value={selected.Subject} />
              <Detail label="Organization" value={orgMap.get(selected.OrganizationID) ?? '—'} />
              <Detail label="Primary Contact" value={contactMap.get(selected.PrimaryContactID!) ?? '—'} />
              <Detail label="Date" value={selected.EventDate ? new Date(selected.EventDate).toLocaleDateString() : undefined} />
              <Detail label="Engagement Type" value={resolveName(engagementTypes, selected.EngagementTypeID)} />
              <Detail label="Outreach Motion" value={resolveName(outreachMotions, selected.OutreachMotionID)} />
              <div className="col-span-2"><Detail label="Outcome" value={selected.Outcome} /></div>
              <Detail label="Response Time (days)" value={selected.ResponseTimeDays != null ? String(selected.ResponseTimeDays) : undefined} />
              <Detail label="Follow-Up Cadence (days)" value={selected.FollowUpCadenceDays != null ? String(selected.FollowUpCadenceDays) : undefined} />
              <Detail label="Next Step" value={selected.NextStep} />
              <Detail label="Next Step Date" value={selected.NextStepDate ? new Date(selected.NextStepDate).toLocaleDateString() : undefined} />
              {selected.Notes && <div className="col-span-2"><Detail label="Notes" value={selected.Notes} /></div>}
            </dl>
          </>
        )}
        {selected && editing && (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.Subject ?? ''} onChange={e => setEditForm(f => ({ ...f, Subject: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Organization</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OrganizationID ?? ''} onChange={e => setEditForm(f => ({ ...f, OrganizationID: e.target.value }))}>
                  <option value="">Select…</option>
                  {orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Primary Contact</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.PrimaryContactID ?? ''} onChange={e => setEditForm(f => ({ ...f, PrimaryContactID: e.target.value }))}>
                  <option value="">Select…</option>
                  {contacts.map(c => <option key={c.ContactID} value={c.ContactID}>{c.FirstName} {c.LastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Event Date</label>
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.EventDate ?? ''} onChange={e => setEditForm(f => ({ ...f, EventDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Outreach Motion</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OutreachMotionID ?? ''} onChange={e => setEditForm(f => ({ ...f, OutreachMotionID: e.target.value }))}>
                  <option value="">Select…</option>
                  {outreachMotions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Engagement Type</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.EngagementTypeID ?? ''} onChange={e => setEditForm(f => ({ ...f, EngagementTypeID: e.target.value }))}>
                  <option value="">Select…</option>
                  {engagementTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Response Time (days)</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.ResponseTimeDays ?? ''} onChange={e => setEditForm(f => ({ ...f, ResponseTimeDays: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Follow-Up Cadence (days)</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.FollowUpCadenceDays ?? ''} onChange={e => setEditForm(f => ({ ...f, FollowUpCadenceDays: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Outcome</label>
                <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.Outcome ?? ''} onChange={e => setEditForm(f => ({ ...f, Outcome: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.Notes ?? ''} onChange={e => setEditForm(f => ({ ...f, Notes: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Next Step</label>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.NextStep ?? ''} onChange={e => setEditForm(f => ({ ...f, NextStep: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Next Step Date</label>
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.NextStepDate ?? ''} onChange={e => setEditForm(f => ({ ...f, NextStepDate: e.target.value }))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEdit} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm({}); }} title="New Engagement Event" size="xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2">
            <FormField label="Subject" required>
              {id => <input id={id} className={inputClass} value={form.Subject ?? ''} onChange={e => setForm(f => ({ ...f, Subject: e.target.value }))} />}
            </FormField>
          </div>
          <FormField label="Organization">
            {id => (
              <select id={id} className={selectClass} value={form.OrganizationID ?? ''} onChange={e => setForm(f => ({ ...f, OrganizationID: e.target.value }))}>
                <option value="">Select…</option>
                {orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Primary Contact">
            {id => (
              <select id={id} className={selectClass} value={form.PrimaryContactID ?? ''} onChange={e => setForm(f => ({ ...f, PrimaryContactID: e.target.value }))}>
                <option value="">Select…</option>
                {contacts.map(c => <option key={c.ContactID} value={c.ContactID}>{c.FirstName} {c.LastName}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Event Date">
            {id => <input id={id} type="date" className={inputClass} value={form.EventDate ?? ''} onChange={e => setForm(f => ({ ...f, EventDate: e.target.value }))} />}
          </FormField>
          <FormField label="Engagement Type">
            {id => (
              <select id={id} className={selectClass} value={form.EngagementTypeID ?? ''} onChange={e => setForm(f => ({ ...f, EngagementTypeID: e.target.value }))}>
                <option value="">Select…</option>
                {engagementTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Outreach Motion">
            {id => (
              <select id={id} className={selectClass} value={form.OutreachMotionID ?? ''} onChange={e => setForm(f => ({ ...f, OutreachMotionID: e.target.value }))}>
                <option value="">Select…</option>
                {outreachMotions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </FormField>
          <div className="col-span-2">
            <FormField label="Outcome">
              {id => <textarea id={id} rows={2} className={inputClass} value={form.Outcome ?? ''} onChange={e => setForm(f => ({ ...f, Outcome: e.target.value }))} />}
            </FormField>
          </div>
          <FormField label="Next Step">
            {id => <input id={id} className={inputClass} value={form.NextStep ?? ''} onChange={e => setForm(f => ({ ...f, NextStep: e.target.value }))} />}
          </FormField>
          <FormField label="Next Step Date">
            {id => <input id={id} type="date" className={inputClass} value={form.NextStepDate ?? ''} onChange={e => setForm(f => ({ ...f, NextStepDate: e.target.value }))} />}
          </FormField>
          <div className="col-span-2">
            <FormField label="Notes">
              {id => <textarea id={id} rows={2} className={inputClass} value={form.Notes ?? ''} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} />}
            </FormField>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowCreate(false); setForm({}); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !form.Subject} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Create Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value || '—'}</dd>
    </div>
  );
}
