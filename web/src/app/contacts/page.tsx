'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Contact, Organization, LookupItem } from '@/types';
import {
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  fetchOrganizations,
  loadLookup,
  resolveName,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type ImportConfig } from '@/components/grid';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<LookupItem[]>([]);
  const [influenceLevels, setInfluenceLevels] = useState<LookupItem[]>([]);
  const [riskTolerances, setRiskTolerances] = useState<LookupItem[]>([]);
  const [personalOrientations, setPersonalOrientations] = useState<LookupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'destructive' } | null>(null);

  const reload = useCallback(async () => {
    try {
      const [c, o, fa, il, rt, po] = await Promise.all([
        fetchContacts(),
        fetchOrganizations(),
        loadLookup('functionalAreas'),
        loadLookup('influenceLevels'),
        loadLookup('riskToleranceLevels'),
        loadLookup('personalOrientations'),
      ]);
      setContacts(c);
      setOrgs(o);
      setFunctionalAreas(fa);
      setInfluenceLevels(il);
      setRiskTolerances(rt);
      setPersonalOrientations(po);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const orgMap = useMemo(
    () => new Map(orgs.map(o => [o.OrganizationID, o.OrganizationName])),
    [orgs],
  );

  const columns: GridColumn<Contact>[] = useMemo(() => [
    {
      key: 'FullName', header: 'Full Name', type: 'string' as const, sortable: true, searchable: true,
      render: c => <span className="font-medium text-gray-900">{c.FirstName} {c.LastName}</span>,
      getValue: c => `${c.FirstName} ${c.LastName}`,
    },
    {
      key: 'Organization', header: 'Organization', type: 'lookup' as const, sortable: true, searchable: true, filterable: true,
      filterOptions: [...new Set(contacts.map(c => orgMap.get(c.OrganizationID!) ?? '').filter(Boolean))].sort().map(n => ({ value: n.toLowerCase(), label: n })),
      render: c => orgMap.get(c.OrganizationID!) ?? '—',
      getValue: c => orgMap.get(c.OrganizationID!) ?? '',
    },
    {
      key: 'Title', header: 'Title', type: 'string' as const, sortable: true, searchable: true,
      getValue: c => c.Title ?? '',
    },
    {
      key: 'Email', header: 'Email', type: 'string' as const, searchable: true,
      getValue: c => c.Email ?? '',
    },
    {
      key: 'Phone', header: 'Phone', type: 'string' as const, defaultVisible: false,
      getValue: c => c.Phone ?? '',
    },
    {
      key: 'FunctionalArea', header: 'Functional Area', type: 'lookup' as const, filterable: true,
      filterOptions: functionalAreas.map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: c => resolveName(functionalAreas, c.FunctionalAreaID),
      getValue: c => resolveName(functionalAreas, c.FunctionalAreaID),
    },
    {
      key: 'InfluenceLevel', header: 'Influence Level', type: 'lookup' as const, filterable: true,
      filterOptions: influenceLevels.map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: c => {
        const name = resolveName(influenceLevels, c.InfluenceLevelID);
        if (name === '—') return '—';
        const color = name.toLowerCase().includes('high') ? 'emerald' as const : name.toLowerCase().includes('medium') ? 'amber' as const : 'slate' as const;
        return <Badge label={name} color={color} />;
      },
      getValue: c => resolveName(influenceLevels, c.InfluenceLevelID),
    },
    {
      key: 'IsPrimary', header: 'Primary', type: 'boolean' as const,
      render: c => c.IsPrimaryContact ? <Badge label="Primary" color="indigo" /> : '—',
      getValue: c => c.IsPrimaryContact ? 'Yes' : 'No',
    },
    {
      key: 'Alumni', header: 'Alumni', type: 'boolean' as const, defaultVisible: false,
      render: c => c.Alumni ? <Badge label="Alumni" color="blue" /> : '—',
      getValue: c => c.Alumni ? 'Yes' : 'No',
    },
    {
      key: 'Notes', header: 'Notes', type: 'string' as const, searchable: true, defaultVisible: false,
      render: c => { const t = c.Notes ?? ''; return t.length > 60 ? `${t.slice(0, 60)}…` : t || '—'; },
      getValue: c => c.Notes ?? '',
    },
  ], [contacts, orgMap, functionalAreas, influenceLevels]);

  const rollupDimensions: RollupDimension[] = useMemo(() => [
    { key: 'org', label: 'Organization', getGroup: (item) => orgMap.get((item as Contact).OrganizationID!) ?? '(none)' },
    { key: 'influence', label: 'Influence Level', getGroup: (item) => resolveName(influenceLevels, (item as Contact).InfluenceLevelID) },
    { key: 'fa', label: 'Functional Area', getGroup: (item) => resolveName(functionalAreas, (item as Contact).FunctionalAreaID) },
  ], [orgMap, influenceLevels, functionalAreas]);

  const importConfig: ImportConfig = useMemo(() => ({
    expectedHeaders: [
      { csvHeader: 'FirstName', fieldKey: 'FirstName', required: true },
      { csvHeader: 'LastName', fieldKey: 'LastName', required: true },
      { csvHeader: 'Email', fieldKey: 'Email' },
      { csvHeader: 'Phone', fieldKey: 'Phone' },
      { csvHeader: 'Title', fieldKey: 'Title' },
      { csvHeader: 'OrganizationName', fieldKey: 'OrganizationName' },
      { csvHeader: 'FunctionalArea', fieldKey: 'FunctionalArea' },
      { csvHeader: 'InfluenceLevel', fieldKey: 'InfluenceLevel' },
      { csvHeader: 'Notes', fieldKey: 'Notes' },
    ],
    duplicateField: 'Email',
    duplicatePolicy: 'skip' as const,
    existingValues: new Set(contacts.map(c => (c.Email ?? '').toLowerCase()).filter(Boolean)),
  }), [contacts]);

  async function handleImport(rows: Record<string, string>[]) {
    const orgNameMap = new Map(orgs.map(o => [o.OrganizationName.toLowerCase(), o.OrganizationID]));
    const faMap = new Map(functionalAreas.map(i => [i.name.toLowerCase(), i.id]));
    const ilMap = new Map(influenceLevels.map(i => [i.name.toLowerCase(), i.id]));
    for (const row of rows) {
      const body: Record<string, unknown> = {
        FirstName: row.FirstName, LastName: row.LastName,
        Email: row.Email || undefined, Phone: row.Phone || undefined,
        Title: row.Title || undefined, Notes: row.Notes || undefined,
      };
      if (row.OrganizationName) body.OrganizationID = orgNameMap.get(row.OrganizationName.toLowerCase());
      if (row.FunctionalArea) body.FunctionalAreaID = faMap.get(row.FunctionalArea.toLowerCase());
      if (row.InfluenceLevel) body.InfluenceLevelID = ilMap.get(row.InfluenceLevel.toLowerCase());
      await createContact(body);
    }
    await reload();
    setToast({ message: `${rows.length} contact(s) imported`, type: 'success' });
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: form.FirstName, LastName: form.LastName,
        Email: form.Email || undefined, Phone: form.Phone || undefined,
        Title: form.Title || undefined, Notes: form.Notes || undefined,
        OrganizationID: form.OrganizationID ? Number(form.OrganizationID) : undefined,
        FunctionalAreaID: form.FunctionalAreaID ? Number(form.FunctionalAreaID) : undefined,
        InfluenceLevelID: form.InfluenceLevelID ? Number(form.InfluenceLevelID) : undefined,
        RiskToleranceID: form.RiskToleranceID ? Number(form.RiskToleranceID) : undefined,
        PersonalOrientationID: form.PersonalOrientationID ? Number(form.PersonalOrientationID) : undefined,
      };
      const created = await createContact(body);
      setContacts(prev => [...prev, created]);
      setShowCreate(false);
      setForm({});
      setToast({ message: 'Contact created', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to create contact', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function openEditForm(contact: Contact) {
    setEditForm({
      FirstName: contact.FirstName ?? '', LastName: contact.LastName ?? '',
      Title: contact.Title ?? '', Email: contact.Email ?? '', Phone: contact.Phone ?? '',
      OrganizationID: contact.OrganizationID != null ? String(contact.OrganizationID) : '',
      FunctionalAreaID: contact.FunctionalAreaID != null ? String(contact.FunctionalAreaID) : '',
      InfluenceLevelID: contact.InfluenceLevelID != null ? String(contact.InfluenceLevelID) : '',
      RiskToleranceID: contact.RiskToleranceID != null ? String(contact.RiskToleranceID) : '',
      PersonalOrientationID: contact.PersonalOrientationID != null ? String(contact.PersonalOrientationID) : '',
      Alumni: contact.Alumni ? '1' : '0',
      ClearanceFamiliarity: contact.ClearanceFamiliarity ? '1' : '0',
      IsPrimaryContact: contact.IsPrimaryContact ? '1' : '0',
      Notes: contact.Notes ?? '',
    });
    setShowEdit(true);
  }

  async function handleEditSave() {
    if (!selected) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: editForm.FirstName, LastName: editForm.LastName,
        Email: editForm.Email || undefined, Phone: editForm.Phone || undefined,
        Title: editForm.Title || undefined, Notes: editForm.Notes || undefined,
        OrganizationID: editForm.OrganizationID ? Number(editForm.OrganizationID) : undefined,
        FunctionalAreaID: editForm.FunctionalAreaID ? Number(editForm.FunctionalAreaID) : undefined,
        InfluenceLevelID: editForm.InfluenceLevelID ? Number(editForm.InfluenceLevelID) : undefined,
        RiskToleranceID: editForm.RiskToleranceID ? Number(editForm.RiskToleranceID) : undefined,
        PersonalOrientationID: editForm.PersonalOrientationID ? Number(editForm.PersonalOrientationID) : undefined,
        Alumni: editForm.Alumni === '1', ClearanceFamiliarity: editForm.ClearanceFamiliarity === '1',
        IsPrimaryContact: editForm.IsPrimaryContact === '1',
      };
      await updateContact(selected.ContactID, body);
      await reload();
      setSelected(null);
      setShowEdit(false);
      setToast({ message: 'Contact updated successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to update contact', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this contact? This cannot be undone.')) return;
    try {
      await deleteContact(id);
      setContacts(prev => prev.filter(c => c.ContactID !== id));
      setSelected(null);
      setShowEdit(false);
      setToast({ message: 'Contact deleted', type: 'destructive' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete', type: 'error' });
    }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="py-16 text-center"><p className="text-sm text-red-600">{error}</p></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Contacts" action={{ label: '+ New Contact', onClick: () => setShowCreate(true) }} />

      <EnhancedDataGrid<Contact>
        data={contacts}
        columns={columns}
        entityName="Contacts"
        onRowClick={item => setSelected(item)}
        emptyMessage="No contacts found. Adjust filters or create a new contact."
        rollupDimensions={rollupDimensions}
        rollupAggregates={[]}
        importConfig={importConfig}
        onImport={handleImport}
        showImport={true}
        showRollup={true}
      />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Detail / Edit Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setShowEdit(false); }} title={showEdit ? 'Edit Contact' : 'Contact Details'} size="xl">
        {selected && !showEdit && (
          <>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Detail label="Name" value={`${selected.FirstName} ${selected.LastName}`} />
              <Detail label="Organization" value={orgMap.get(selected.OrganizationID!) ?? '—'} />
              <Detail label="Title" value={selected.Title} />
              <Detail label="Email" value={selected.Email} />
              <Detail label="Phone" value={selected.Phone} />
              <Detail label="Functional Area" value={resolveName(functionalAreas, selected.FunctionalAreaID)} />
              <Detail label="Influence Level" value={resolveName(influenceLevels, selected.InfluenceLevelID)} />
              <Detail label="Risk Tolerance" value={resolveName(riskTolerances, selected.RiskToleranceID)} />
              <Detail label="Personal Orientation" value={resolveName(personalOrientations, selected.PersonalOrientationID)} />
              <Detail label="Primary Contact" value={selected.IsPrimaryContact ? 'Yes' : 'No'} />
              <Detail label="Alumni" value={selected.Alumni ? 'Yes' : 'No'} />
              <Detail label="Clearance Familiarity" value={selected.ClearanceFamiliarity ? 'Yes' : 'No'} />
              {selected.Notes && <div className="col-span-2"><Detail label="Notes" value={selected.Notes} /></div>}
            </dl>
            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={() => handleDelete(selected.ContactID)} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
              <button onClick={() => openEditForm(selected)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors">Edit</button>
            </div>
          </>
        )}
        {selected && showEdit && (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FormField label="First Name" required>{id => <input id={id} className={inputClass} value={editForm.FirstName ?? ''} onChange={e => setEditForm(f => ({ ...f, FirstName: e.target.value }))} />}</FormField>
              <FormField label="Last Name" required>{id => <input id={id} className={inputClass} value={editForm.LastName ?? ''} onChange={e => setEditForm(f => ({ ...f, LastName: e.target.value }))} />}</FormField>
              <FormField label="Title">{id => <input id={id} className={inputClass} value={editForm.Title ?? ''} onChange={e => setEditForm(f => ({ ...f, Title: e.target.value }))} />}</FormField>
              <FormField label="Email">{id => <input id={id} type="email" className={inputClass} value={editForm.Email ?? ''} onChange={e => setEditForm(f => ({ ...f, Email: e.target.value }))} />}</FormField>
              <FormField label="Phone">{id => <input id={id} className={inputClass} value={editForm.Phone ?? ''} onChange={e => setEditForm(f => ({ ...f, Phone: e.target.value }))} />}</FormField>
              <FormField label="Organization">{id => (<select id={id} className={selectClass} value={editForm.OrganizationID ?? ''} onChange={e => setEditForm(f => ({ ...f, OrganizationID: e.target.value }))}><option value="">Select…</option>{orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}</select>)}</FormField>
              <FormField label="Functional Area">{id => (<select id={id} className={selectClass} value={editForm.FunctionalAreaID ?? ''} onChange={e => setEditForm(f => ({ ...f, FunctionalAreaID: e.target.value }))}><option value="">Select…</option>{functionalAreas.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <FormField label="Influence Level">{id => (<select id={id} className={selectClass} value={editForm.InfluenceLevelID ?? ''} onChange={e => setEditForm(f => ({ ...f, InfluenceLevelID: e.target.value }))}><option value="">Select…</option>{influenceLevels.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <FormField label="Risk Tolerance">{id => (<select id={id} className={selectClass} value={editForm.RiskToleranceID ?? ''} onChange={e => setEditForm(f => ({ ...f, RiskToleranceID: e.target.value }))}><option value="">Select…</option>{riskTolerances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <FormField label="Personal Orientation">{id => (<select id={id} className={selectClass} value={editForm.PersonalOrientationID ?? ''} onChange={e => setEditForm(f => ({ ...f, PersonalOrientationID: e.target.value }))}><option value="">Select…</option>{personalOrientations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.Alumni === '1'} onChange={e => setEditForm(f => ({ ...f, Alumni: e.target.checked ? '1' : '0' }))} /> Alumni</label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.ClearanceFamiliarity === '1'} onChange={e => setEditForm(f => ({ ...f, ClearanceFamiliarity: e.target.checked ? '1' : '0' }))} /> Clearance Familiarity</label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.IsPrimaryContact === '1'} onChange={e => setEditForm(f => ({ ...f, IsPrimaryContact: e.target.checked ? '1' : '0' }))} /> Primary Contact</label>
              </div>
              <div className="col-span-2"><FormField label="Notes">{id => <textarea id={id} rows={3} className={inputClass} value={editForm.Notes ?? ''} onChange={e => setEditForm(f => ({ ...f, Notes: e.target.value }))} />}</FormField></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEdit(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving || !editForm.FirstName || !editForm.LastName} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">{editSaving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm({}); }} title="New Contact" size="xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="First Name" required>{id => <input id={id} className={inputClass} value={form.FirstName ?? ''} onChange={e => setForm(f => ({ ...f, FirstName: e.target.value }))} />}</FormField>
          <FormField label="Last Name" required>{id => <input id={id} className={inputClass} value={form.LastName ?? ''} onChange={e => setForm(f => ({ ...f, LastName: e.target.value }))} />}</FormField>
          <FormField label="Organization">{id => (<select id={id} className={selectClass} value={form.OrganizationID ?? ''} onChange={e => setForm(f => ({ ...f, OrganizationID: e.target.value }))}><option value="">Select…</option>{orgs.map(o => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}</select>)}</FormField>
          <FormField label="Email">{id => <input id={id} type="email" className={inputClass} value={form.Email ?? ''} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))} />}</FormField>
          <FormField label="Phone">{id => <input id={id} className={inputClass} value={form.Phone ?? ''} onChange={e => setForm(f => ({ ...f, Phone: e.target.value }))} />}</FormField>
          <FormField label="Title">{id => <input id={id} className={inputClass} value={form.Title ?? ''} onChange={e => setForm(f => ({ ...f, Title: e.target.value }))} />}</FormField>
          <FormField label="Functional Area">{id => (<select id={id} className={selectClass} value={form.FunctionalAreaID ?? ''} onChange={e => setForm(f => ({ ...f, FunctionalAreaID: e.target.value }))}><option value="">Select…</option>{functionalAreas.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <FormField label="Influence Level">{id => (<select id={id} className={selectClass} value={form.InfluenceLevelID ?? ''} onChange={e => setForm(f => ({ ...f, InfluenceLevelID: e.target.value }))}><option value="">Select…</option>{influenceLevels.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <FormField label="Risk Tolerance">{id => (<select id={id} className={selectClass} value={form.RiskToleranceID ?? ''} onChange={e => setForm(f => ({ ...f, RiskToleranceID: e.target.value }))}><option value="">Select…</option>{riskTolerances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <FormField label="Personal Orientation">{id => (<select id={id} className={selectClass} value={form.PersonalOrientationID ?? ''} onChange={e => setForm(f => ({ ...f, PersonalOrientationID: e.target.value }))}><option value="">Select…</option>{personalOrientations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <div className="col-span-2"><FormField label="Notes">{id => <textarea id={id} rows={3} className={inputClass} value={form.Notes ?? ''} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} />}</FormField></div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowCreate(false); setForm({}); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !form.FirstName || !form.LastName} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Create Contact'}</button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-0.5 text-gray-900">{value || '—'}</dd></div>;
}
