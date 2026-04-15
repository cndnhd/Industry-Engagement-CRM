'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, fetchOrganizations, loadLookup, resolveName } from '@/lib/api';
import type { Opportunity, Organization, LookupItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge, { type BadgeColor } from '@/components/ui/Badge';
import FormField from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type RollupAggregate, type ImportConfig } from '@/components/grid';

const STATUS_COLOR: Record<string, BadgeColor> = {
  Active: 'blue', Won: 'emerald', Lost: 'red', Paused: 'amber', Cancelled: 'gray',
};

const INPUT = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [types, setTypes] = useState<LookupItem[]>([]);
  const [stages, setStages] = useState<LookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [opps, orgList, typeList, stageList, statusList] = await Promise.all([
        fetchOpportunities(), fetchOrganizations(),
        loadLookup('opportunityTypes'), loadLookup('opportunityStages'), loadLookup('opportunityStatuses'),
      ]);
      setOpportunities(opps); setOrgs(orgList); setTypes(typeList); setStages(stageList); setStatuses(statusList);
    } catch (e) {
      console.error('Failed to load opportunities', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const orgName = (id: number) => orgs.find(o => o.OrganizationID === id)?.OrganizationName ?? '—';

  const columns: GridColumn<Opportunity>[] = useMemo(() => [
    {
      key: 'OpportunityName', header: 'Name', type: 'string' as const, sortable: true, searchable: true, filterable: true,
      render: r => <button onClick={() => setDetailOpp(r)} className="text-indigo-600 hover:underline font-medium text-left">{r.OpportunityName}</button>,
      getValue: r => r.OpportunityName,
    },
    {
      key: 'Organization', header: 'Organization', type: 'lookup' as const, sortable: true, searchable: true, filterable: true,
      filterOptions: orgs.map(o => ({ value: o.OrganizationName.toLowerCase(), label: o.OrganizationName })),
      render: r => orgName(r.OrganizationID),
      getValue: r => orgName(r.OrganizationID),
    },
    {
      key: 'Type', header: 'Type', type: 'lookup' as const, filterable: true,
      filterOptions: types.map(t => ({ value: t.name.toLowerCase(), label: t.name })),
      render: r => resolveName(types, r.OpportunityTypeID),
      getValue: r => resolveName(types, r.OpportunityTypeID),
    },
    {
      key: 'Stage', header: 'Stage', type: 'lookup' as const, sortable: true, filterable: true,
      filterOptions: stages.map(s => ({ value: s.name.toLowerCase(), label: s.name })),
      render: r => <Badge label={resolveName(stages, r.StageID)} color="indigo" />,
      getValue: r => resolveName(stages, r.StageID),
    },
    {
      key: 'Status', header: 'Status', type: 'lookup' as const, filterable: true,
      filterOptions: statuses.map(s => ({ value: s.name.toLowerCase(), label: s.name })),
      render: r => { const name = resolveName(statuses, r.StatusID); return <Badge label={name} color={STATUS_COLOR[name] ?? 'gray'} />; },
      getValue: r => resolveName(statuses, r.StatusID),
    },
    {
      key: 'EstimatedValue', header: 'Value', type: 'number' as const, sortable: true,
      render: r => r.EstimatedValue != null ? `$${r.EstimatedValue.toLocaleString()}` : '—',
      getValue: r => r.EstimatedValue ?? null,
      aggregatable: true, aggregateLabel: 'Total Value',
    },
    {
      key: 'TargetCloseDate', header: 'Close Date', type: 'date' as const, sortable: true, filterable: true,
      render: r => r.TargetCloseDate ? new Date(r.TargetCloseDate).toLocaleDateString() : '—',
      getValue: r => r.TargetCloseDate ?? '',
    },
    {
      key: 'OwnerName', header: 'Owner', type: 'string' as const, searchable: true,
      getValue: r => r.OwnerName ?? '',
    },
    {
      key: 'ProbabilityScore', header: 'Probability', type: 'number' as const, sortable: true, defaultVisible: false,
      render: r => r.ProbabilityScore != null ? `${r.ProbabilityScore}%` : '—',
      getValue: r => r.ProbabilityScore ?? null,
    },
    {
      key: 'NextStep', header: 'Next Step', type: 'string' as const, searchable: true, defaultVisible: false,
      getValue: r => r.NextStep ?? '',
    },
    {
      key: 'Notes', header: 'Notes', type: 'string' as const, searchable: true, defaultVisible: false,
      render: r => { const t = r.Notes ?? ''; return t.length > 60 ? `${t.slice(0, 60)}…` : t || '—'; },
      getValue: r => r.Notes ?? '',
    },
  ], [orgs, types, stages, statuses]);

  const rollupDimensions: RollupDimension[] = useMemo(() => [
    { key: 'org', label: 'Organization', getGroup: (item) => orgName((item as Opportunity).OrganizationID) },
    { key: 'stage', label: 'Stage', getGroup: (item) => resolveName(stages, (item as Opportunity).StageID) },
    { key: 'status', label: 'Status', getGroup: (item) => resolveName(statuses, (item as Opportunity).StatusID) },
    { key: 'type', label: 'Type', getGroup: (item) => resolveName(types, (item as Opportunity).OpportunityTypeID) },
  ], [orgs, stages, statuses, types]);

  const rollupAggregates: RollupAggregate[] = useMemo(() => [
    { key: 'totalValue', label: 'Total Value ($)', type: 'sum' as const, getValue: (item) => (item as Opportunity).EstimatedValue ?? 0 },
    { key: 'avgValue', label: 'Avg Value ($)', type: 'average' as const, getValue: (item) => (item as Opportunity).EstimatedValue ?? 0 },
  ], []);

  const importConfig: ImportConfig = useMemo(() => ({
    expectedHeaders: [
      { csvHeader: 'OpportunityName', fieldKey: 'OpportunityName', required: true },
      { csvHeader: 'OrganizationName', fieldKey: 'OrganizationName', required: true },
      { csvHeader: 'Type', fieldKey: 'Type' },
      { csvHeader: 'Stage', fieldKey: 'Stage' },
      { csvHeader: 'Status', fieldKey: 'Status' },
      { csvHeader: 'EstimatedValue', fieldKey: 'EstimatedValue' },
      { csvHeader: 'TargetCloseDate', fieldKey: 'TargetCloseDate' },
      { csvHeader: 'Owner', fieldKey: 'Owner' },
      { csvHeader: 'Notes', fieldKey: 'Notes' },
    ],
    duplicatePolicy: 'skip' as const,
  }), []);

  async function handleImport(rows: Record<string, string>[]) {
    const orgNameMap = new Map(orgs.map(o => [o.OrganizationName.toLowerCase(), o.OrganizationID]));
    const typeMap = new Map(types.map(t => [t.name.toLowerCase(), t.id]));
    const stageMap = new Map(stages.map(s => [s.name.toLowerCase(), s.id]));
    const statusMap = new Map(statuses.map(s => [s.name.toLowerCase(), s.id]));
    for (const row of rows) {
      await createOpportunity({
        OpportunityName: row.OpportunityName,
        OrganizationID: orgNameMap.get(row.OrganizationName?.toLowerCase() ?? ''),
        OpportunityTypeID: row.Type ? typeMap.get(row.Type.toLowerCase()) : undefined,
        StageID: row.Stage ? stageMap.get(row.Stage.toLowerCase()) : undefined,
        StatusID: row.Status ? statusMap.get(row.Status.toLowerCase()) : undefined,
        EstimatedValue: row.EstimatedValue ? Number(row.EstimatedValue) : undefined,
        TargetCloseDate: row.TargetCloseDate || undefined,
        OwnerName: row.Owner || undefined,
        Notes: row.Notes || undefined,
      });
    }
    await load();
    setToast({ message: `${rows.length} opportunity(s) imported`, type: 'success' });
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await createOpportunity({
        OpportunityName: newForm.name,
        OrganizationID: newForm.orgId ? Number(newForm.orgId) : undefined,
        OpportunityTypeID: newForm.typeId ? Number(newForm.typeId) : undefined,
        StageID: newForm.stageId ? Number(newForm.stageId) : undefined,
        StatusID: newForm.statusId ? Number(newForm.statusId) : undefined,
        EstimatedValue: newForm.value ? Number(newForm.value) : undefined,
        TargetCloseDate: newForm.closeDate || undefined,
        OwnerName: newForm.owner || undefined,
        Notes: newForm.description || undefined,
      });
      setShowNew(false); setNewForm({}); await load();
      setToast({ message: 'Opportunity created', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to create opportunity', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function startEditOpp(o: Opportunity) {
    setEditForm({
      OpportunityName: o.OpportunityName ?? '',
      OrganizationID: o.OrganizationID != null ? String(o.OrganizationID) : '',
      OpportunityTypeID: o.OpportunityTypeID != null ? String(o.OpportunityTypeID) : '',
      StageID: o.StageID != null ? String(o.StageID) : '',
      StatusID: o.StatusID != null ? String(o.StatusID) : '',
      OwnerName: o.OwnerName ?? '',
      EstimatedValue: o.EstimatedValue != null ? String(o.EstimatedValue) : '',
      ProbabilityScore: o.ProbabilityScore != null ? String(o.ProbabilityScore) : '',
      StrategicImportanceScore: o.StrategicImportanceScore != null ? String(o.StrategicImportanceScore) : '',
      OpenedDate: o.OpenedDate ? o.OpenedDate.slice(0, 10) : '',
      TargetCloseDate: o.TargetCloseDate ? o.TargetCloseDate.slice(0, 10) : '',
      ClosedDate: o.ClosedDate ? o.ClosedDate.slice(0, 10) : '',
      NextStep: o.NextStep ?? '',
      Notes: o.Notes ?? '',
    });
    setEditing(true);
  }

  async function handleEditOpp() {
    if (!detailOpp) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        OpportunityName: editForm.OpportunityName || undefined,
        OrganizationID: editForm.OrganizationID ? Number(editForm.OrganizationID) : undefined,
        OpportunityTypeID: editForm.OpportunityTypeID ? Number(editForm.OpportunityTypeID) : undefined,
        StageID: editForm.StageID ? Number(editForm.StageID) : undefined,
        StatusID: editForm.StatusID ? Number(editForm.StatusID) : undefined,
        OwnerName: editForm.OwnerName || undefined,
        EstimatedValue: editForm.EstimatedValue ? Number(editForm.EstimatedValue) : undefined,
        ProbabilityScore: editForm.ProbabilityScore ? Number(editForm.ProbabilityScore) : undefined,
        StrategicImportanceScore: editForm.StrategicImportanceScore ? Number(editForm.StrategicImportanceScore) : undefined,
        OpenedDate: editForm.OpenedDate || undefined,
        TargetCloseDate: editForm.TargetCloseDate || undefined,
        ClosedDate: editForm.ClosedDate || undefined,
        NextStep: editForm.NextStep || undefined,
        Notes: editForm.Notes || undefined,
      };
      await updateOpportunity(detailOpp.OpportunityID, body);
      await load(); setDetailOpp(null); setEditing(false);
      setToast({ message: 'Opportunity updated successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to update opportunity', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!detailOpp) return;
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    setSaving(true);
    try {
      await deleteOpportunity(detailOpp.OpportunityID);
      setOpportunities(prev => prev.filter(o => o.OpportunityID !== detailOpp.OpportunityID));
      setDetailOpp(null); setEditing(false);
      setToast({ message: 'Opportunity deleted successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to delete opportunity', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Opportunities" />
        <div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading opportunities…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Opportunities" action={{ label: '+ New Opportunity', onClick: () => setShowNew(true) }} />
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button onClick={() => setView('table')} className={`px-3 py-1.5 ${view === 'table' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Table</button>
          <button onClick={() => setView('kanban')} className={`px-3 py-1.5 ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Kanban</button>
        </div>
      </div>

      {view === 'table' ? (
        <EnhancedDataGrid<Opportunity>
          data={opportunities}
          columns={columns}
          entityName="Opportunities"
          onRowClick={item => setDetailOpp(item)}
          emptyMessage="No opportunities found."
          rollupDimensions={rollupDimensions}
          rollupAggregates={rollupAggregates}
          importConfig={importConfig}
          onImport={handleImport}
          showImport={true}
          showRollup={true}
        />
      ) : (
        <KanbanBoard opportunities={opportunities} stages={stages} statuses={statuses} orgName={orgName} onSelect={setDetailOpp} resolveName={resolveName} />
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Detail / Edit modal */}
      <Modal isOpen={!!detailOpp} onClose={() => { setDetailOpp(null); setEditing(false); }} title={editing ? 'Edit Opportunity' : (detailOpp?.OpportunityName ?? '')} size="xl">
        {detailOpp && !editing && (
          <>
            <div className="mb-4 flex justify-end gap-2">
              <button type="button" onClick={handleDelete} disabled={saving} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Delete</button>
              <button onClick={() => startEditOpp(detailOpp)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Organization" value={orgName(detailOpp.OrganizationID)} />
              <Detail label="Type" value={resolveName(types, detailOpp.OpportunityTypeID)} />
              <Detail label="Stage" value={resolveName(stages, detailOpp.StageID)} />
              <Detail label="Status" value={resolveName(statuses, detailOpp.StatusID)} />
              <Detail label="Estimated Value" value={detailOpp.EstimatedValue != null ? `$${detailOpp.EstimatedValue.toLocaleString()}` : '—'} />
              <Detail label="Target Close" value={detailOpp.TargetCloseDate ? new Date(detailOpp.TargetCloseDate).toLocaleDateString() : '—'} />
              <Detail label="Owner" value={detailOpp.OwnerName ?? '—'} />
              <Detail label="Probability" value={detailOpp.ProbabilityScore != null ? `${detailOpp.ProbabilityScore}%` : '—'} />
              <Detail label="Strategic Importance" value={detailOpp.StrategicImportanceScore != null ? String(detailOpp.StrategicImportanceScore) : '—'} />
              <Detail label="Next Step" value={detailOpp.NextStep ?? '—'} />
              {detailOpp.Notes && <div className="col-span-2"><Detail label="Notes" value={detailOpp.Notes} /></div>}
            </div>
          </>
        )}
        {detailOpp && editing && (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Opportunity Name</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OpportunityName ?? ''} onChange={e => setEditForm(f => ({ ...f, OpportunityName: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Organization</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OrganizationID ?? ''} onChange={e => setEditForm(f => ({ ...f, OrganizationID: e.target.value }))}><option value="">Select…</option>{orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}</select></div>
              <div><label className="text-sm font-medium text-gray-700">Type</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OpportunityTypeID ?? ''} onChange={e => setEditForm(f => ({ ...f, OpportunityTypeID: e.target.value }))}><option value="">Select…</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="text-sm font-medium text-gray-700">Stage</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.StageID ?? ''} onChange={e => setEditForm(f => ({ ...f, StageID: e.target.value }))}><option value="">Select…</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-sm font-medium text-gray-700">Status</label><select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.StatusID ?? ''} onChange={e => setEditForm(f => ({ ...f, StatusID: e.target.value }))}><option value="">Select…</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-sm font-medium text-gray-700">Owner</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OwnerName ?? ''} onChange={e => setEditForm(f => ({ ...f, OwnerName: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Estimated Value ($)</label><input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.EstimatedValue ?? ''} onChange={e => setEditForm(f => ({ ...f, EstimatedValue: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Probability (%)</label><input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.ProbabilityScore ?? ''} onChange={e => setEditForm(f => ({ ...f, ProbabilityScore: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Strategic Importance</label><input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.StrategicImportanceScore ?? ''} onChange={e => setEditForm(f => ({ ...f, StrategicImportanceScore: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Opened Date</label><input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.OpenedDate ?? ''} onChange={e => setEditForm(f => ({ ...f, OpenedDate: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Target Close Date</label><input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.TargetCloseDate ?? ''} onChange={e => setEditForm(f => ({ ...f, TargetCloseDate: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Closed Date</label><input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.ClosedDate ?? ''} onChange={e => setEditForm(f => ({ ...f, ClosedDate: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">Next Step</label><input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.NextStep ?? ''} onChange={e => setEditForm(f => ({ ...f, NextStep: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Notes</label><textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={editForm.Notes ?? ''} onChange={e => setEditForm(f => ({ ...f, Notes: e.target.value }))} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEditOpp} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </>
        )}
      </Modal>

      {/* New opportunity modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); setNewForm({}); }} title="New Opportunity" size="xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="Opportunity Name" required>{id => <input id={id} placeholder="Enter name" className={INPUT} value={newForm.name ?? ''} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} />}</FormField>
          <FormField label="Organization" required>{id => (<select id={id} className={INPUT} value={newForm.orgId ?? ''} onChange={e => setNewForm(p => ({ ...p, orgId: e.target.value }))}><option value="">Select…</option>{orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}</select>)}</FormField>
          <FormField label="Type">{id => (<select id={id} className={INPUT} value={newForm.typeId ?? ''} onChange={e => setNewForm(p => ({ ...p, typeId: e.target.value }))}><option value="">Select…</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}</FormField>
          <FormField label="Stage">{id => (<select id={id} className={INPUT} value={newForm.stageId ?? ''} onChange={e => setNewForm(p => ({ ...p, stageId: e.target.value }))}><option value="">Select…</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>)}</FormField>
          <FormField label="Status">{id => (<select id={id} className={INPUT} value={newForm.statusId ?? ''} onChange={e => setNewForm(p => ({ ...p, statusId: e.target.value }))}><option value="">Select…</option>{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>)}</FormField>
          <FormField label="Estimated Value ($)">{id => <input id={id} type="number" placeholder="0" className={INPUT} value={newForm.value ?? ''} onChange={e => setNewForm(p => ({ ...p, value: e.target.value }))} />}</FormField>
          <FormField label="Expected Close Date">{id => <input id={id} type="date" className={INPUT} value={newForm.closeDate ?? ''} onChange={e => setNewForm(p => ({ ...p, closeDate: e.target.value }))} />}</FormField>
          <FormField label="Owner">{id => <input id={id} placeholder="Enter owner name" className={INPUT} value={newForm.owner ?? ''} onChange={e => setNewForm(p => ({ ...p, owner: e.target.value }))} />}</FormField>
          <div className="col-span-2"><FormField label="Description">{id => <textarea id={id} rows={3} placeholder="Optional description" className={INPUT} value={newForm.description ?? ''} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))} />}</FormField></div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowNew(false); setNewForm({}); }} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !newForm.name || !newForm.orgId} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Create Opportunity'}</button>
        </div>
      </Modal>
    </div>
  );
}

function KanbanBoard({ opportunities, stages, statuses, orgName, onSelect, resolveName: resolve }: {
  opportunities: Opportunity[]; stages: LookupItem[]; statuses: LookupItem[];
  orgName: (id: number) => string; onSelect: (o: Opportunity) => void;
  resolveName: (items: LookupItem[], id?: number | null) => string;
}) {
  const grouped = stages.map(stage => ({ stage, items: opportunities.filter(o => o.StageID === stage.id) }));
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouped.map(({ stage, items }) => (
        <div key={stage.id} className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{stage.name}</h3>
            <span className="text-xs font-medium text-gray-400">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No items</p>}
            {items.map(opp => {
              const statusName = resolve(statuses, opp.StatusID);
              return (
                <button key={opp.OpportunityID} onClick={() => onSelect(opp)} className="w-full text-left bg-white rounded-lg shadow-sm p-4 hover:ring-2 hover:ring-indigo-300 transition-all">
                  <p className="text-sm font-medium text-gray-900 truncate">{opp.OpportunityName}</p>
                  <p className="mt-1 text-xs text-gray-500 truncate">{orgName(opp.OrganizationID)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {opp.EstimatedValue != null ? <span className="text-xs font-semibold text-gray-700">${opp.EstimatedValue.toLocaleString()}</span> : <span className="text-xs text-gray-400">—</span>}
                    <Badge label={statusName} color={STATUS_COLOR[statusName] ?? 'gray'} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p><p className="mt-0.5 text-gray-900">{value}</p></div>;
}
