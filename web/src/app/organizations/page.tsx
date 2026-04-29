'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchOrganizations, createOrganization, loadLookup, resolveName, setOrganizationOrgTypes } from '@/lib/api';
import type { Organization, LookupItem } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type RollupAggregate, type ImportConfig } from '@/components/grid';

const LOOKUP_TABLES = [
  'orgTypes', 'ownershipTypes', 'growthStages',
  'priorityLevels', 'contractorRoles', 'relationshipLevels',
  'partnershipStages',
] as const;

type Lookups = Record<string, LookupItem[]>;

const EMPTY_FORM: Record<string, string> = {
  OrganizationName: '', City: '', State: '', HeadquartersLocation: '',
  OrgTypeID: '', OwnershipTypeID: '', GrowthStageID: '',
  PriorityLevelID: '', ContractorRoleID: '', RelationshipLevelID: '',
  Notes: '',
  LinkedInURL: '', GeneralEmail: '', MainPhone: '',
  AnnualRevenueRange: '', EmployeeCountRange: '', NAICSCode: '',
  PublicPrivateStatus: '', BusinessModelType: '',
  PartnershipStageID: '', EngagementStatus: '', StrategicPriorityLevel: '',
  AssignedOwner: '', AssignedTeam: '',
  HQCountry: '', PrimaryRegion: '',
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [lookups, setLookups] = useState<Lookups>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [selectedOrgTypes, setSelectedOrgTypes] = useState<number[]>([]);

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
    {
      key: 'PartnershipStage',
      header: 'Partnership Stage',
      type: 'lookup' as const,
      sortable: true,
      filterable: true,
      defaultVisible: false,
      filterOptions: (lookups.partnershipStages ?? []).map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: (row) => resolveName(lookups.partnershipStages ?? [], row.PartnershipStageID as number | undefined),
      getValue: (row) => resolveName(lookups.partnershipStages ?? [], row.PartnershipStageID as number | undefined),
    },
    {
      key: 'StrategicPriority',
      header: 'Strategic Priority',
      type: 'string' as const,
      sortable: true,
      filterable: true,
      defaultVisible: false,
      filterOptions: ['Low', 'Medium', 'High', 'Critical'].map(s => ({ value: s.toLowerCase(), label: s })),
      render: (row) => {
        const val = row.StrategicPriorityLevel;
        if (!val) return '—';
        const colorMap: Record<string, 'red' | 'amber' | 'slate' | 'purple'> = { Critical: 'red', High: 'amber', Medium: 'slate', Low: 'slate' };
        return <Badge label={val} color={colorMap[val] ?? 'gray'} />;
      },
      getValue: (row) => row.StrategicPriorityLevel ?? '',
    },
    {
      key: 'EngagementStatus',
      header: 'Engagement Status',
      type: 'string' as const,
      sortable: true,
      filterable: true,
      defaultVisible: false,
      filterOptions: ['Active', 'Inactive', 'Dormant', 'Prospecting'].map(s => ({ value: s.toLowerCase(), label: s })),
      render: (row) => {
        const val = row.EngagementStatus;
        if (!val) return '—';
        const colorMap: Record<string, 'emerald' | 'slate' | 'amber' | 'blue'> = { Active: 'emerald', Inactive: 'slate', Dormant: 'amber', Prospecting: 'blue' };
        return <Badge label={val} color={colorMap[val] ?? 'gray'} />;
      },
      getValue: (row) => row.EngagementStatus ?? '',
    },
    {
      key: 'AssignedOwner',
      header: 'Assigned Owner',
      type: 'string' as const,
      sortable: true,
      filterable: true,
      searchable: true,
      defaultVisible: false,
      render: (row) => row.AssignedOwner || '—',
      getValue: (row) => row.AssignedOwner ?? '',
    },
    {
      key: 'Tags',
      header: 'Tags',
      type: 'string' as const,
      defaultVisible: false,
      render: () => '—',
      getValue: () => '',
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

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const body: Record<string, unknown> = {
        OrganizationName: row.OrganizationName,
        City: row.City || null,
        State: row.State || null,
        Notes: row.Notes || null,
      };
      if (row.OrgType) body.OrgTypeID = typeMap.get(row.OrgType.trim().toLowerCase()) ?? null;
      if (row.PriorityLevel) body.PriorityLevelID = prioMap.get(row.PriorityLevel.trim().toLowerCase()) ?? null;
      if (row.RelationshipLevel) body.RelationshipLevelID = relMap.get(row.RelationshipLevel.trim().toLowerCase()) ?? null;
      try {
        await createOrganization(body);
        imported++;
      } catch {
        skipped++;
      }
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
        City: form.City || null,
        State: form.State || null,
        HeadquartersLocation: form.HeadquartersLocation || null,
        Notes: form.Notes || null,
        OwnershipTypeID: form.OwnershipTypeID ? Number(form.OwnershipTypeID) : null,
        GrowthStageID: form.GrowthStageID ? Number(form.GrowthStageID) : null,
        PriorityLevelID: form.PriorityLevelID ? Number(form.PriorityLevelID) : null,
        ContractorRoleID: form.ContractorRoleID ? Number(form.ContractorRoleID) : null,
        RelationshipLevelID: form.RelationshipLevelID ? Number(form.RelationshipLevelID) : null,
        LinkedInURL: form.LinkedInURL || null,
        GeneralEmail: form.GeneralEmail || null,
        MainPhone: form.MainPhone || null,
        AnnualRevenueRange: form.AnnualRevenueRange || null,
        EmployeeCountRange: form.EmployeeCountRange || null,
        NAICSCode: form.NAICSCode || null,
        PublicPrivateStatus: form.PublicPrivateStatus || null,
        BusinessModelType: form.BusinessModelType || null,
        PartnershipStageID: form.PartnershipStageID ? Number(form.PartnershipStageID) : null,
        EngagementStatus: form.EngagementStatus || null,
        StrategicPriorityLevel: form.StrategicPriorityLevel || null,
        AssignedOwner: form.AssignedOwner || null,
        AssignedTeam: form.AssignedTeam || null,
        HQCountry: form.HQCountry || null,
        PrimaryRegion: form.PrimaryRegion || null,
      };
      const createdOrg = await createOrganization(body);
      if (selectedOrgTypes.length > 0) {
        await setOrganizationOrgTypes(createdOrg.OrganizationID, selectedOrgTypes);
      }
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      setSelectedOrgTypes([]);
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

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelectedOrgTypes([]); }} title="New Organization" size="xl">
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
          <div className="md:col-span-2">
            <FormField label="Organization Type">
              {() => (
                <div className="grid grid-cols-3 gap-2">
                  {(lookups.orgTypes ?? []).map(ot => (
                    <label key={ot.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedOrgTypes.includes(ot.id)}
                        onChange={() => setSelectedOrgTypes(prev =>
                          prev.includes(ot.id) ? prev.filter(id => id !== ot.id) : [...prev, ot.id]
                        )}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {ot.name}
                    </label>
                  ))}
                </div>
              )}
            </FormField>
          </div>
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

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 md:col-span-2">Contact Info</h3>
          <FormField label="LinkedIn URL">
            {id => <input id={id} className={inputClass} value={form.LinkedInURL} onChange={e => handleFormChange('LinkedInURL', e.target.value)} />}
          </FormField>
          <FormField label="General Email">
            {id => <input id={id} className={inputClass} value={form.GeneralEmail} onChange={e => handleFormChange('GeneralEmail', e.target.value)} />}
          </FormField>
          <FormField label="Main Phone">
            {id => <input id={id} className={inputClass} value={form.MainPhone} onChange={e => handleFormChange('MainPhone', e.target.value)} />}
          </FormField>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 md:col-span-2">Classification</h3>
          <FormField label="Public / Private Status">
            {id => (
              <select id={id} className={selectClass} value={form.PublicPrivateStatus} onChange={e => handleFormChange('PublicPrivateStatus', e.target.value)}>
                <option value="">Select…</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Government">Government</option>
                <option value="Nonprofit">Nonprofit</option>
              </select>
            )}
          </FormField>
          <FormField label="Annual Revenue Range">
            {id => (
              <select id={id} className={selectClass} value={form.AnnualRevenueRange} onChange={e => handleFormChange('AnnualRevenueRange', e.target.value)}>
                <option value="">Select…</option>
                <option value="<$1M">{'<$1M'}</option>
                <option value="$1M-$10M">$1M–$10M</option>
                <option value="$10M-$100M">$10M–$100M</option>
                <option value="$100M-$1B">$100M–$1B</option>
                <option value="$1B+">$1B+</option>
              </select>
            )}
          </FormField>
          <FormField label="Employee Count Range">
            {id => (
              <select id={id} className={selectClass} value={form.EmployeeCountRange} onChange={e => handleFormChange('EmployeeCountRange', e.target.value)}>
                <option value="">Select…</option>
                <option value="1-50">1–50</option>
                <option value="51-200">51–200</option>
                <option value="201-1000">201–1,000</option>
                <option value="1001-5000">1,001–5,000</option>
                <option value="5000+">5,000+</option>
              </select>
            )}
          </FormField>
          <FormField label="NAICS Code">
            {id => <input id={id} className={inputClass} value={form.NAICSCode} onChange={e => handleFormChange('NAICSCode', e.target.value)} />}
          </FormField>
          <FormField label="Business Model Type">
            {id => <input id={id} className={inputClass} value={form.BusinessModelType} onChange={e => handleFormChange('BusinessModelType', e.target.value)} />}
          </FormField>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 md:col-span-2">Strategy</h3>
          <FormField label="Partnership Stage">
            {id => (
              <select id={id} className={selectClass} value={form.PartnershipStageID} onChange={e => handleFormChange('PartnershipStageID', e.target.value)}>
                <option value="">Select…</option>
                {(lookups.partnershipStages ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Strategic Priority Level">
            {id => (
              <select id={id} className={selectClass} value={form.StrategicPriorityLevel} onChange={e => handleFormChange('StrategicPriorityLevel', e.target.value)}>
                <option value="">Select…</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            )}
          </FormField>
          <FormField label="Engagement Status">
            {id => (
              <select id={id} className={selectClass} value={form.EngagementStatus} onChange={e => handleFormChange('EngagementStatus', e.target.value)}>
                <option value="">Select…</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Dormant">Dormant</option>
                <option value="Prospecting">Prospecting</option>
              </select>
            )}
          </FormField>
          <FormField label="Assigned Owner">
            {id => <input id={id} className={inputClass} value={form.AssignedOwner} onChange={e => handleFormChange('AssignedOwner', e.target.value)} />}
          </FormField>
          <FormField label="Assigned Team">
            {id => <input id={id} className={inputClass} value={form.AssignedTeam} onChange={e => handleFormChange('AssignedTeam', e.target.value)} />}
          </FormField>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 md:col-span-2">Location</h3>
          <FormField label="HQ Country">
            {id => <input id={id} className={inputClass} value={form.HQCountry} onChange={e => handleFormChange('HQCountry', e.target.value)} />}
          </FormField>
          <FormField label="Primary Region">
            {id => <input id={id} className={inputClass} value={form.PrimaryRegion} onChange={e => handleFormChange('PrimaryRegion', e.target.value)} />}
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setModalOpen(false); setSelectedOrgTypes([]); }} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.OrganizationName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Create Organization'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
