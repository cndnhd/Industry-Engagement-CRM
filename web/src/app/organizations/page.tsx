'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchOrganizations, createOrganization, loadLookup, resolveName } from '@/lib/api';
import type { Organization, LookupItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type RollupAggregate, type ImportConfig } from '@/components/grid';

const LOOKUP_TABLES = [
  'orgTypes', 'ownershipTypes', 'growthStages',
  'priorityLevels', 'contractorRoles', 'relationshipLevels',
] as const;

type Lookups = Record<string, LookupItem[]>;

const EMPTY_FORM: Record<string, string> = {
  OrganizationName: '', City: '', State: '', HeadquartersLocation: '',
  OrgTypeID: '', OwnershipTypeID: '', GrowthStageID: '',
  PriorityLevelID: '', ContractorRoleID: '', RelationshipLevelID: '',
  Notes: '',
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [lookups, setLookups] = useState<Lookups>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [orgList, ...lookupResults] = await Promise.all([
        fetchOrganizations(),
        ...LOOKUP_TABLES.map((t) => loadLookup(t)),
      ]);
      setOrgs(orgList);
      const lk: Lookups = {};
      LOOKUP_TABLES.forEach((t, i) => { lk[t] = lookupResults[i]; });
      setLookups(lk);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const columns: GridColumn<Organization>[] = useMemo(() => [
    {
      key: 'OrganizationName',
      header: 'Organization',
      type: 'string' as const,
      sortable: true,
      searchable: true,
      filterable: true,
      render: (row) => (
        <Link href={`/organizations/${row.OrganizationID}`} className="font-medium text-blue-600 hover:text-blue-800">
          {row.OrganizationName}
        </Link>
      ),
      getValue: (row) => row.OrganizationName,
    },
    {
      key: 'Location',
      header: 'Location',
      type: 'string' as const,
      sortable: true,
      searchable: true,
      render: (row) => [row.City, row.State].filter(Boolean).join(', ') || '—',
      getValue: (row) => [row.City, row.State].filter(Boolean).join(', '),
    },
    {
      key: 'State',
      header: 'State',
      type: 'string' as const,
      sortable: true,
      filterable: true,
      defaultVisible: false,
      filterOptions: [...new Set(orgs.map(o => o.State).filter(Boolean) as string[])].sort().map(s => ({ value: s.toLowerCase(), label: s })),
      getValue: (row) => row.State ?? '',
    },
    {
      key: 'Priority',
      header: 'Priority',
      type: 'lookup' as const,
      sortable: true,
      filterable: true,
      filterOptions: (lookups.priorityLevels ?? []).map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: (row) => {
        const name = resolveName(lookups.priorityLevels ?? [], row.PriorityLevelID);
        if (name === '—') return name;
        const colorMap: Record<string, 'red' | 'amber' | 'slate'> = { High: 'red', Medium: 'amber', Low: 'slate' };
        return <Badge label={name} color={colorMap[name] ?? 'gray'} />;
      },
      getValue: (row) => resolveName(lookups.priorityLevels ?? [], row.PriorityLevelID),
    },
    {
      key: 'OrgType',
      header: 'Type',
      type: 'lookup' as const,
      filterable: true,
      filterOptions: (lookups.orgTypes ?? []).map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: (row) => resolveName(lookups.orgTypes ?? [], row.OrgTypeID),
      getValue: (row) => resolveName(lookups.orgTypes ?? [], row.OrgTypeID),
    },
    {
      key: 'Ownership',
      header: 'Ownership',
      type: 'lookup' as const,
      defaultVisible: false,
      render: (row) => resolveName(lookups.ownershipTypes ?? [], row.OwnershipTypeID),
      getValue: (row) => resolveName(lookups.ownershipTypes ?? [], row.OwnershipTypeID),
    },
    {
      key: 'GrowthStage',
      header: 'Growth Stage',
      type: 'lookup' as const,
      defaultVisible: false,
      render: (row) => resolveName(lookups.growthStages ?? [], row.GrowthStageID),
      getValue: (row) => resolveName(lookups.growthStages ?? [], row.GrowthStageID),
    },
    {
      key: 'Relationship',
      header: 'Relationship',
      type: 'lookup' as const,
      sortable: true,
      filterable: true,
      filterOptions: (lookups.relationshipLevels ?? []).map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: (row) => {
        const name = resolveName(lookups.relationshipLevels ?? [], row.RelationshipLevelID);
        if (name === '—') return name;
        return <Badge label={name} color="blue" />;
      },
      getValue: (row) => resolveName(lookups.relationshipLevels ?? [], row.RelationshipLevelID),
    },
    {
      key: 'RegionalFootprint',
      header: 'Region',
      type: 'string' as const,
      searchable: true,
      render: (row) => row.RegionalFootprint ?? '—',
      getValue: (row) => row.RegionalFootprint ?? '',
    },
    {
      key: 'Notes',
      header: 'Notes',
      type: 'string' as const,
      searchable: true,
      defaultVisible: false,
      render: (row) => { const t = row.Notes ?? ''; return t.length > 60 ? `${t.slice(0, 60)}…` : t || '—'; },
      getValue: (row) => row.Notes ?? '',
    },
  ], [orgs, lookups]);

  const rollupDimensions: RollupDimension[] = useMemo(() => [
    { key: 'priority', label: 'Priority', getGroup: (item) => resolveName(lookups.priorityLevels ?? [], (item as Organization).PriorityLevelID) },
    { key: 'orgType', label: 'Org Type', getGroup: (item) => resolveName(lookups.orgTypes ?? [], (item as Organization).OrgTypeID) },
    { key: 'relationship', label: 'Relationship', getGroup: (item) => resolveName(lookups.relationshipLevels ?? [], (item as Organization).RelationshipLevelID) },
    { key: 'state', label: 'State', getGroup: (item) => (item as Organization).State ?? '(none)' },
  ], [lookups]);

  const rollupAggregates: RollupAggregate[] = [];

  const importConfig: ImportConfig = useMemo(() => ({
    expectedHeaders: [
      { csvHeader: 'OrganizationName', fieldKey: 'OrganizationName', required: true },
      { csvHeader: 'City', fieldKey: 'City' },
      { csvHeader: 'State', fieldKey: 'State' },
      { csvHeader: 'OrgType', fieldKey: 'OrgType' },
      { csvHeader: 'PriorityLevel', fieldKey: 'PriorityLevel' },
      { csvHeader: 'RelationshipLevel', fieldKey: 'RelationshipLevel' },
      { csvHeader: 'Notes', fieldKey: 'Notes' },
    ],
    duplicateField: 'OrganizationName',
    duplicatePolicy: 'skip' as const,
    existingValues: new Set(orgs.map(o => o.OrganizationName.toLowerCase())),
  }), [orgs]);

  async function handleImport(rows: Record<string, string>[]) {
    const typeMap = new Map((lookups.orgTypes ?? []).map(i => [i.name.toLowerCase(), i.id]));
    const prioMap = new Map((lookups.priorityLevels ?? []).map(i => [i.name.toLowerCase(), i.id]));
    const relMap = new Map((lookups.relationshipLevels ?? []).map(i => [i.name.toLowerCase(), i.id]));

    for (const row of rows) {
      const body: Record<string, unknown> = {
        OrganizationName: row.OrganizationName,
        City: row.City || undefined,
        State: row.State || undefined,
        Notes: row.Notes || undefined,
      };
      if (row.OrgType) body.OrgTypeID = typeMap.get(row.OrgType.toLowerCase());
      if (row.PriorityLevel) body.PriorityLevelID = prioMap.get(row.PriorityLevel.toLowerCase());
      if (row.RelationshipLevel) body.RelationshipLevelID = relMap.get(row.RelationshipLevel.toLowerCase());
      await createOrganization(body);
    }
    setLoading(true);
    await loadData();
  }

  function handleFormChange(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    if (!form.OrganizationName.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        OrganizationName: form.OrganizationName,
        City: form.City || undefined,
        State: form.State || undefined,
        HeadquartersLocation: form.HeadquartersLocation || undefined,
        Notes: form.Notes || undefined,
        OrgTypeID: form.OrgTypeID ? Number(form.OrgTypeID) : undefined,
        OwnershipTypeID: form.OwnershipTypeID ? Number(form.OwnershipTypeID) : undefined,
        GrowthStageID: form.GrowthStageID ? Number(form.GrowthStageID) : undefined,
        PriorityLevelID: form.PriorityLevelID ? Number(form.PriorityLevelID) : undefined,
        ContractorRoleID: form.ContractorRoleID ? Number(form.ContractorRoleID) : undefined,
        RelationshipLevelID: form.RelationshipLevelID ? Number(form.RelationshipLevelID) : undefined,
      };
      await createOrganization(body);
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      setLoading(true);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        action={{ label: '+ New Organization', onClick: () => setModalOpen(true) }}
      />

      <EnhancedDataGrid<Organization>
        data={orgs}
        columns={columns}
        entityName="Organizations"
        emptyMessage="No organizations match your filters."
        rollupDimensions={rollupDimensions}
        rollupAggregates={rollupAggregates}
        importConfig={importConfig}
        onImport={handleImport}
        showImport={true}
        showRollup={true}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Organization" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Organization Name" required>
            {id => <input id={id} className={inputClass} value={form.OrganizationName} onChange={e => handleFormChange('OrganizationName', e.target.value)} />}
          </FormField>
          <FormField label="City">
            {id => <input id={id} className={inputClass} value={form.City} onChange={e => handleFormChange('City', e.target.value)} />}
          </FormField>
          <FormField label="State">
            {id => <input id={id} className={inputClass} value={form.State} onChange={e => handleFormChange('State', e.target.value)} />}
          </FormField>
          <FormField label="Headquarters Location">
            {id => <input id={id} className={inputClass} value={form.HeadquartersLocation} onChange={e => handleFormChange('HeadquartersLocation', e.target.value)} />}
          </FormField>
          <FormField label="Organization Type">
            {id => (
              <select id={id} className={selectClass} value={form.OrgTypeID} onChange={e => handleFormChange('OrgTypeID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.orgTypes ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Ownership Type">
            {id => (
              <select id={id} className={selectClass} value={form.OwnershipTypeID} onChange={e => handleFormChange('OwnershipTypeID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.ownershipTypes ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Growth Stage">
            {id => (
              <select id={id} className={selectClass} value={form.GrowthStageID} onChange={e => handleFormChange('GrowthStageID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.growthStages ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Priority Level">
            {id => (
              <select id={id} className={selectClass} value={form.PriorityLevelID} onChange={e => handleFormChange('PriorityLevelID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.priorityLevels ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Contractor Role">
            {id => (
              <select id={id} className={selectClass} value={form.ContractorRoleID} onChange={e => handleFormChange('ContractorRoleID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.contractorRoles ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Relationship Level">
            {id => (
              <select id={id} className={selectClass} value={form.RelationshipLevelID} onChange={e => handleFormChange('RelationshipLevelID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.relationshipLevels ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Notes">
              {id => <textarea id={id} rows={3} className={inputClass} value={form.Notes} onChange={e => handleFormChange('Notes', e.target.value)} />}
            </FormField>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.OrganizationName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Create Organization'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
