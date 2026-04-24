'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Contact, Organization, LookupItem, UserList } from '@/types';
import {
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  fetchOrganizations,
  loadLookup,
  resolveName,
  fetchUserLists,
  addListMembership,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type ImportConfig } from '@/components/grid';

const STRENGTH_LABELS: Record<number, string> = { 1: 'Weak', 2: 'Developing', 3: 'Strong', 4: 'Very Strong' };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<LookupItem[]>([]);
  const [influenceLevels, setInfluenceLevels] = useState<LookupItem[]>([]);
  const [riskTolerances, setRiskTolerances] = useState<LookupItem[]>([]);
  const [personalOrientations, setPersonalOrientations] = useState<LookupItem[]>([]);
  const [seniorityLevels, setSeniorityLevels] = useState<LookupItem[]>([]);
  const [contactTypes, setContactTypes] = useState<LookupItem[]>([]);
  const [personaTypes, setPersonaTypes] = useState<LookupItem[]>([]);

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

  const [contactLists, setContactLists] = useState<UserList[]>([]);
  const [listPickId, setListPickId] = useState('');

  const reload = useCallback(async () => {
    try {
      const [c, o, fa, il, rt, po, sl, ct, pt] = await Promise.all([
        fetchContacts(),
        fetchOrganizations(),
        loadLookup('functionalAreas'),
        loadLookup('influenceLevels'),
        loadLookup('riskToleranceLevels'),
        loadLookup('personalOrientations'),
        loadLookup('seniorityLevels'),
        loadLookup('contactTypes'),
        loadLookup('personaTypes'),
      ]);
      setContacts(c);
      setOrgs(o);
      setFunctionalAreas(fa);
      setInfluenceLevels(il);
      setRiskTolerances(rt);
      setPersonalOrientations(po);
      setSeniorityLevels(sl);
      setContactTypes(ct);
      setPersonaTypes(pt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    fetchUserLists({ entityType: 'C' })
      .then(setContactLists)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFormChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const handleEditFormChange = (key: string, value: string) => setEditForm(f => ({ ...f, [key]: value }));

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
    {
      key: 'Department', header: 'Department', type: 'string' as const, sortable: true, filterable: true, defaultVisible: false,
      filterOptions: [...new Set(contacts.map(c => c.Department ?? '').filter(Boolean))].sort().map(n => ({ value: n.toLowerCase(), label: n })),
      getValue: c => c.Department ?? '',
    },
    {
      key: 'Seniority', header: 'Seniority', type: 'lookup' as const, filterable: true, defaultVisible: false,
      filterOptions: seniorityLevels.map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: c => resolveName(seniorityLevels, c.SeniorityLevelID),
      getValue: c => resolveName(seniorityLevels, c.SeniorityLevelID),
    },
    {
      key: 'ContactType', header: 'Contact Type', type: 'lookup' as const, filterable: true, defaultVisible: false,
      filterOptions: contactTypes.map(i => ({ value: i.name.toLowerCase(), label: i.name })),
      render: c => resolveName(contactTypes, c.ContactTypeID),
      getValue: c => resolveName(contactTypes, c.ContactTypeID),
    },
    {
      key: 'City', header: 'City', type: 'string' as const, defaultVisible: false,
      getValue: c => c.City ?? '',
    },
    {
      key: 'WarmthStatus', header: 'Warmth', type: 'string' as const, filterable: true, defaultVisible: false,
      filterOptions: ['Cold', 'Warm', 'Hot'].map(n => ({ value: n.toLowerCase(), label: n })),
      render: c => {
        const w = c.WarmthStatus;
        if (!w) return '—';
        const color = w === 'Hot' ? 'rose' as const : w === 'Warm' ? 'amber' as const : 'cyan' as const;
        return <Badge label={w} color={color} />;
      },
      getValue: c => c.WarmthStatus ?? '',
    },
    {
      key: 'RelationshipStrength', header: 'Rel. Strength', type: 'string' as const, filterable: true, defaultVisible: false,
      filterOptions: ['Weak', 'Developing', 'Strong', 'Very Strong'].map(n => ({ value: n.toLowerCase(), label: n })),
      getValue: c => {
        const v = c.RelationshipStrength;
        if (v == null) return '';
        return STRENGTH_LABELS[v] ?? String(v);
      },
    },
    {
      key: 'RoleFlags', header: 'Roles', type: 'string' as const, defaultVisible: false,
      render: c => {
        const flags = [
          { v: c.DecisionMakerFlag, label: 'DM', color: 'indigo' as const },
          { v: c.ChampionFlag, label: 'Champ', color: 'emerald' as const },
          { v: c.DonorFlag, label: 'Donor', color: 'amber' as const },
          { v: c.SpeakerFlag, label: 'Spkr', color: 'purple' as const },
          { v: c.AdvisoryBoardFlag, label: 'Adv', color: 'blue' as const },
          { v: c.HiringContactFlag, label: 'Hire', color: 'cyan' as const },
          { v: c.InternshipContactFlag, label: 'Intern', color: 'rose' as const },
          { v: c.ResearchContactFlag, label: 'Rsch', color: 'red' as const },
          { v: c.LegislativeContactFlag, label: 'Leg', color: 'slate' as const },
        ];
        const active = flags.filter(f => f.v);
        if (!active.length) return '—';
        return <div className="flex flex-wrap gap-1">{active.map(f => <Badge key={f.label} label={f.label} color={f.color} />)}</div>;
      },
      getValue: c => {
        const names: string[] = [];
        if (c.DecisionMakerFlag) names.push('Decision Maker');
        if (c.ChampionFlag) names.push('Champion');
        if (c.DonorFlag) names.push('Donor');
        if (c.SpeakerFlag) names.push('Speaker');
        if (c.AdvisoryBoardFlag) names.push('Advisory Board');
        if (c.HiringContactFlag) names.push('Hiring');
        if (c.InternshipContactFlag) names.push('Internship');
        if (c.ResearchContactFlag) names.push('Research');
        if (c.LegislativeContactFlag) names.push('Legislative');
        return names.join(', ');
      },
    },
  ], [contacts, orgMap, functionalAreas, influenceLevels, seniorityLevels, contactTypes]);

  const rollupDimensions: RollupDimension[] = useMemo(() => [
    { key: 'org', label: 'Organization', getGroup: (item) => orgMap.get((item as Contact).OrganizationID!) ?? '(none)' },
    { key: 'influence', label: 'Influence Level', getGroup: (item) => resolveName(influenceLevels, (item as Contact).InfluenceLevelID) },
    { key: 'fa', label: 'Functional Area', getGroup: (item) => resolveName(functionalAreas, (item as Contact).FunctionalAreaID) },
    { key: 'warmth', label: 'Warmth Status', getGroup: (item) => (item as Contact).WarmthStatus ?? '(none)' },
    { key: 'seniority', label: 'Seniority', getGroup: (item) => resolveName(seniorityLevels, (item as Contact).SeniorityLevelID) },
    { key: 'contactType', label: 'Contact Type', getGroup: (item) => resolveName(contactTypes, (item as Contact).ContactTypeID) },
  ], [orgMap, influenceLevels, functionalAreas, seniorityLevels, contactTypes]);

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
    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const orgId = row.OrganizationName
        ? orgNameMap.get(row.OrganizationName.trim().toLowerCase())
        : undefined;
      if (!orgId) {
        skipped++;
        continue;
      }
      const body: Record<string, unknown> = {
        FirstName: row.FirstName,
        LastName: row.LastName,
        OrganizationID: orgId,
        Email: row.Email || null,
        Phone: row.Phone || null,
        Title: row.Title || null,
        Notes: row.Notes || null,
      };
      if (row.FunctionalArea) body.FunctionalAreaID = faMap.get(row.FunctionalArea.trim().toLowerCase()) ?? null;
      if (row.InfluenceLevel) body.InfluenceLevelID = ilMap.get(row.InfluenceLevel.trim().toLowerCase()) ?? null;
      try {
        await createContact(body);
        imported++;
      } catch {
        skipped++;
      }
    }
    await reload();
    const msg = skipped > 0
      ? `${imported} contact(s) imported, ${skipped} skipped (no matching organization)`
      : `${imported} contact(s) imported`;
    setToast({ message: msg, type: imported > 0 ? 'success' : 'error' });
  }

  async function handleCreate() {
    setSaving(true);
    try {
      if (!form.OrganizationID) {
        setToast({ message: 'Organization is required', type: 'error' });
        setSaving(false);
        return;
      }
      const body: Record<string, unknown> = {
        FirstName: form.FirstName, LastName: form.LastName,
        Email: form.Email || null, Phone: form.Phone || null,
        Title: form.Title || null, Notes: form.Notes || null,
        OrganizationID: Number(form.OrganizationID),
        FunctionalAreaID: form.FunctionalAreaID ? Number(form.FunctionalAreaID) : null,
        InfluenceLevelID: form.InfluenceLevelID ? Number(form.InfluenceLevelID) : null,
        RiskToleranceID: form.RiskToleranceID ? Number(form.RiskToleranceID) : null,
        PersonalOrientationID: form.PersonalOrientationID ? Number(form.PersonalOrientationID) : null,
        Prefix: form.Prefix || null,
        PreferredName: form.PreferredName || null,
        SecondaryEmail: form.SecondaryEmail || null,
        OfficePhone: form.OfficePhone || null,
        LinkedInURL: form.LinkedInURL || null,
        Department: form.Department || null,
        SeniorityLevelID: form.SeniorityLevelID ? Number(form.SeniorityLevelID) : null,
        ContactTypeID: form.ContactTypeID ? Number(form.ContactTypeID) : null,
        PersonaTypeID: form.PersonaTypeID ? Number(form.PersonaTypeID) : null,
        City: form.City || null,
        State: form.State || null,
        Country: form.Country || null,
        RelationshipOwner: form.RelationshipOwner || null,
        CommunicationPreference: form.CommunicationPreference || null,
        WarmthStatus: form.WarmthStatus || null,
        RelationshipStrength: form.RelationshipStrength || null,
        DecisionMakerFlag: form.DecisionMakerFlag === 'true',
        ChampionFlag: form.ChampionFlag === 'true',
        DonorFlag: form.DonorFlag === 'true',
        SpeakerFlag: form.SpeakerFlag === 'true',
        AdvisoryBoardFlag: form.AdvisoryBoardFlag === 'true',
        HiringContactFlag: form.HiringContactFlag === 'true',
        InternshipContactFlag: form.InternshipContactFlag === 'true',
        ResearchContactFlag: form.ResearchContactFlag === 'true',
        LegislativeContactFlag: form.LegislativeContactFlag === 'true',
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
      Prefix: contact.Prefix ?? '',
      PreferredName: contact.PreferredName ?? '',
      SecondaryEmail: contact.SecondaryEmail ?? '',
      OfficePhone: contact.OfficePhone ?? '',
      LinkedInURL: contact.LinkedInURL ?? '',
      Department: contact.Department ?? '',
      SeniorityLevelID: contact.SeniorityLevelID != null ? String(contact.SeniorityLevelID) : '',
      ContactTypeID: contact.ContactTypeID != null ? String(contact.ContactTypeID) : '',
      PersonaTypeID: contact.PersonaTypeID != null ? String(contact.PersonaTypeID) : '',
      City: contact.City ?? '',
      State: contact.State ?? '',
      Country: contact.Country ?? '',
      RelationshipOwner: contact.RelationshipOwner ?? '',
      CommunicationPreference: contact.CommunicationPreference ?? '',
      WarmthStatus: contact.WarmthStatus ?? '',
      RelationshipStrength: contact.RelationshipStrength != null ? (STRENGTH_LABELS[contact.RelationshipStrength] ?? String(contact.RelationshipStrength)) : '',
      DecisionMakerFlag: contact.DecisionMakerFlag ? 'true' : 'false',
      ChampionFlag: contact.ChampionFlag ? 'true' : 'false',
      DonorFlag: contact.DonorFlag ? 'true' : 'false',
      SpeakerFlag: contact.SpeakerFlag ? 'true' : 'false',
      AdvisoryBoardFlag: contact.AdvisoryBoardFlag ? 'true' : 'false',
      HiringContactFlag: contact.HiringContactFlag ? 'true' : 'false',
      InternshipContactFlag: contact.InternshipContactFlag ? 'true' : 'false',
      ResearchContactFlag: contact.ResearchContactFlag ? 'true' : 'false',
      LegislativeContactFlag: contact.LegislativeContactFlag ? 'true' : 'false',
    });
    setShowEdit(true);
  }

  async function handleEditSave() {
    if (!selected) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: editForm.FirstName, LastName: editForm.LastName,
        Email: editForm.Email || null, Phone: editForm.Phone || null,
        Title: editForm.Title || null, Notes: editForm.Notes || null,
        OrganizationID: editForm.OrganizationID ? Number(editForm.OrganizationID) : selected.OrganizationID,
        FunctionalAreaID: editForm.FunctionalAreaID ? Number(editForm.FunctionalAreaID) : null,
        InfluenceLevelID: editForm.InfluenceLevelID ? Number(editForm.InfluenceLevelID) : null,
        RiskToleranceID: editForm.RiskToleranceID ? Number(editForm.RiskToleranceID) : null,
        PersonalOrientationID: editForm.PersonalOrientationID ? Number(editForm.PersonalOrientationID) : null,
        Prefix: editForm.Prefix || null,
        PreferredName: editForm.PreferredName || null,
        SecondaryEmail: editForm.SecondaryEmail || null,
        OfficePhone: editForm.OfficePhone || null,
        LinkedInURL: editForm.LinkedInURL || null,
        Department: editForm.Department || null,
        SeniorityLevelID: editForm.SeniorityLevelID ? Number(editForm.SeniorityLevelID) : null,
        ContactTypeID: editForm.ContactTypeID ? Number(editForm.ContactTypeID) : null,
        PersonaTypeID: editForm.PersonaTypeID ? Number(editForm.PersonaTypeID) : null,
        City: editForm.City || null,
        State: editForm.State || null,
        Country: editForm.Country || null,
        RelationshipOwner: editForm.RelationshipOwner || null,
        CommunicationPreference: editForm.CommunicationPreference || null,
        WarmthStatus: editForm.WarmthStatus || null,
        RelationshipStrength: editForm.RelationshipStrength || null,
        DecisionMakerFlag: editForm.DecisionMakerFlag === 'true',
        ChampionFlag: editForm.ChampionFlag === 'true',
        DonorFlag: editForm.DonorFlag === 'true',
        SpeakerFlag: editForm.SpeakerFlag === 'true',
        AdvisoryBoardFlag: editForm.AdvisoryBoardFlag === 'true',
        HiringContactFlag: editForm.HiringContactFlag === 'true',
        InternshipContactFlag: editForm.InternshipContactFlag === 'true',
        ResearchContactFlag: editForm.ResearchContactFlag === 'true',
        LegislativeContactFlag: editForm.LegislativeContactFlag === 'true',
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

  async function handleAddToList() {
    if (!selected || !listPickId) return;
    try {
      await addListMembership(Number(listPickId), { ContactID: selected.ContactID });
      setToast({ message: 'Added to list', type: 'success' });
      setListPickId('');
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Could not add to list',
        type: 'error',
      });
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
              <Detail label="Prefix" value={selected.Prefix} />
              <Detail label="Preferred Name" value={selected.PreferredName} />
              <Detail label="Secondary Email" value={selected.SecondaryEmail} />
              <Detail label="Office Phone" value={selected.OfficePhone} />
              <Detail label="LinkedIn URL" value={selected.LinkedInURL} />
              <Detail label="Department" value={selected.Department} />
              <Detail label="Seniority" value={resolveName(seniorityLevels, selected.SeniorityLevelID)} />
              <Detail label="Contact Type" value={resolveName(contactTypes, selected.ContactTypeID)} />
              <Detail label="Persona Type" value={resolveName(personaTypes, selected.PersonaTypeID)} />
              <Detail label="City" value={selected.City} />
              <Detail label="State" value={selected.State} />
              <Detail label="Country" value={selected.Country} />
              <Detail label="Relationship Owner" value={selected.RelationshipOwner} />
              <Detail label="Communication Preference" value={selected.CommunicationPreference} />
              <Detail label="Warmth Status" value={selected.WarmthStatus} />
              <Detail label="Relationship Strength" value={selected.RelationshipStrength != null ? (STRENGTH_LABELS[selected.RelationshipStrength] ?? String(selected.RelationshipStrength)) : undefined} />
              {(selected.DecisionMakerFlag || selected.ChampionFlag || selected.DonorFlag || selected.SpeakerFlag || selected.AdvisoryBoardFlag || selected.HiringContactFlag || selected.InternshipContactFlag || selected.ResearchContactFlag || selected.LegislativeContactFlag) && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500">Roles</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {selected.DecisionMakerFlag && <Badge label="Decision Maker" color="indigo" />}
                    {selected.ChampionFlag && <Badge label="Champion" color="emerald" />}
                    {selected.DonorFlag && <Badge label="Donor" color="amber" />}
                    {selected.SpeakerFlag && <Badge label="Speaker" color="purple" />}
                    {selected.AdvisoryBoardFlag && <Badge label="Advisory Board" color="blue" />}
                    {selected.HiringContactFlag && <Badge label="Hiring Contact" color="cyan" />}
                    {selected.InternshipContactFlag && <Badge label="Internship Contact" color="rose" />}
                    {selected.ResearchContactFlag && <Badge label="Research Contact" color="red" />}
                    {selected.LegislativeContactFlag && <Badge label="Legislative Contact" color="slate" />}
                  </dd>
                </div>
              )}
              {selected.Notes && <div className="col-span-2"><Detail label="Notes" value={selected.Notes} /></div>}
            </dl>
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Add to list</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  id="contact-add-list"
                  className={`${selectClass} min-w-0 flex-1`}
                  value={listPickId}
                  onChange={(e) => setListPickId(e.target.value)}
                >
                  <option value="">Select list…</option>
                  {contactLists.map((l) => (
                    <option key={l.ListID} value={l.ListID}>
                      {l.Name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!listPickId}
                  onClick={handleAddToList}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
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

              <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Name Details</h3></div>
              <FormField label="Prefix">{id => <input id={id} className={inputClass} value={editForm.Prefix ?? ''} onChange={e => handleEditFormChange('Prefix', e.target.value)} />}</FormField>
              <FormField label="Preferred Name">{id => <input id={id} className={inputClass} value={editForm.PreferredName ?? ''} onChange={e => handleEditFormChange('PreferredName', e.target.value)} />}</FormField>

              <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Contact Details</h3></div>
              <FormField label="Secondary Email">{id => <input id={id} type="email" className={inputClass} value={editForm.SecondaryEmail ?? ''} onChange={e => handleEditFormChange('SecondaryEmail', e.target.value)} />}</FormField>
              <FormField label="Office Phone">{id => <input id={id} className={inputClass} value={editForm.OfficePhone ?? ''} onChange={e => handleEditFormChange('OfficePhone', e.target.value)} />}</FormField>
              <FormField label="LinkedIn URL">{id => <input id={id} className={inputClass} value={editForm.LinkedInURL ?? ''} onChange={e => handleEditFormChange('LinkedInURL', e.target.value)} />}</FormField>
              <FormField label="Department">{id => <input id={id} className={inputClass} value={editForm.Department ?? ''} onChange={e => handleEditFormChange('Department', e.target.value)} />}</FormField>
              <FormField label="Seniority Level">{id => (<select id={id} className={selectClass} value={editForm.SeniorityLevelID ?? ''} onChange={e => handleEditFormChange('SeniorityLevelID', e.target.value)}><option value="">Select…</option>{seniorityLevels.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <FormField label="Contact Type">{id => (<select id={id} className={selectClass} value={editForm.ContactTypeID ?? ''} onChange={e => handleEditFormChange('ContactTypeID', e.target.value)}><option value="">Select…</option>{contactTypes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
              <FormField label="Persona Type">{id => (<select id={id} className={selectClass} value={editForm.PersonaTypeID ?? ''} onChange={e => handleEditFormChange('PersonaTypeID', e.target.value)}><option value="">Select…</option>{personaTypes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>

              <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Location</h3></div>
              <FormField label="City">{id => <input id={id} className={inputClass} value={editForm.City ?? ''} onChange={e => handleEditFormChange('City', e.target.value)} />}</FormField>
              <FormField label="State">{id => <input id={id} className={inputClass} value={editForm.State ?? ''} onChange={e => handleEditFormChange('State', e.target.value)} />}</FormField>
              <FormField label="Country">{id => <input id={id} className={inputClass} value={editForm.Country ?? ''} onChange={e => handleEditFormChange('Country', e.target.value)} />}</FormField>

              <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Relationship</h3></div>
              <FormField label="Relationship Owner">{id => <input id={id} className={inputClass} value={editForm.RelationshipOwner ?? ''} onChange={e => handleEditFormChange('RelationshipOwner', e.target.value)} />}</FormField>
              <FormField label="Communication Preference">{id => (<select id={id} className={selectClass} value={editForm.CommunicationPreference ?? ''} onChange={e => handleEditFormChange('CommunicationPreference', e.target.value)}><option value="">Select…</option><option value="Email">Email</option><option value="Phone">Phone</option><option value="In-Person">In-Person</option><option value="Video Call">Video Call</option></select>)}</FormField>
              <FormField label="Warmth Status">{id => (<select id={id} className={selectClass} value={editForm.WarmthStatus ?? ''} onChange={e => handleEditFormChange('WarmthStatus', e.target.value)}><option value="">Select…</option><option value="Cold">Cold</option><option value="Warm">Warm</option><option value="Hot">Hot</option></select>)}</FormField>
              <FormField label="Relationship Strength">{id => (<select id={id} className={selectClass} value={editForm.RelationshipStrength ?? ''} onChange={e => handleEditFormChange('RelationshipStrength', e.target.value)}><option value="">Select…</option><option value="Weak">Weak</option><option value="Developing">Developing</option><option value="Strong">Strong</option><option value="Very Strong">Very Strong</option></select>)}</FormField>

              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.Alumni === '1'} onChange={e => setEditForm(f => ({ ...f, Alumni: e.target.checked ? '1' : '0' }))} /> Alumni</label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.ClearanceFamiliarity === '1'} onChange={e => setEditForm(f => ({ ...f, ClearanceFamiliarity: e.target.checked ? '1' : '0' }))} /> Clearance Familiarity</label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.IsPrimaryContact === '1'} onChange={e => setEditForm(f => ({ ...f, IsPrimaryContact: e.target.checked ? '1' : '0' }))} /> Primary Contact</label>
              </div>

              <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Role Flags</h3></div>
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.DecisionMakerFlag === 'true'} onChange={e => handleEditFormChange('DecisionMakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Decision Maker</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.ChampionFlag === 'true'} onChange={e => handleEditFormChange('ChampionFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Champion</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.DonorFlag === 'true'} onChange={e => handleEditFormChange('DonorFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Donor</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.SpeakerFlag === 'true'} onChange={e => handleEditFormChange('SpeakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Speaker</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.AdvisoryBoardFlag === 'true'} onChange={e => handleEditFormChange('AdvisoryBoardFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Advisory Board</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.HiringContactFlag === 'true'} onChange={e => handleEditFormChange('HiringContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Hiring Contact</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.InternshipContactFlag === 'true'} onChange={e => handleEditFormChange('InternshipContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Internship Contact</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.ResearchContactFlag === 'true'} onChange={e => handleEditFormChange('ResearchContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Research Contact</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.LegislativeContactFlag === 'true'} onChange={e => handleEditFormChange('LegislativeContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Legislative Contact</label>
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

          <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Name Details</h3></div>
          <FormField label="Prefix">{id => <input id={id} className={inputClass} value={form.Prefix ?? ''} onChange={e => handleFormChange('Prefix', e.target.value)} />}</FormField>
          <FormField label="Preferred Name">{id => <input id={id} className={inputClass} value={form.PreferredName ?? ''} onChange={e => handleFormChange('PreferredName', e.target.value)} />}</FormField>

          <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Contact Details</h3></div>
          <FormField label="Secondary Email">{id => <input id={id} type="email" className={inputClass} value={form.SecondaryEmail ?? ''} onChange={e => handleFormChange('SecondaryEmail', e.target.value)} />}</FormField>
          <FormField label="Office Phone">{id => <input id={id} className={inputClass} value={form.OfficePhone ?? ''} onChange={e => handleFormChange('OfficePhone', e.target.value)} />}</FormField>
          <FormField label="LinkedIn URL">{id => <input id={id} className={inputClass} value={form.LinkedInURL ?? ''} onChange={e => handleFormChange('LinkedInURL', e.target.value)} />}</FormField>
          <FormField label="Department">{id => <input id={id} className={inputClass} value={form.Department ?? ''} onChange={e => handleFormChange('Department', e.target.value)} />}</FormField>
          <FormField label="Seniority Level">{id => (<select id={id} className={selectClass} value={form.SeniorityLevelID ?? ''} onChange={e => handleFormChange('SeniorityLevelID', e.target.value)}><option value="">Select…</option>{seniorityLevels.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <FormField label="Contact Type">{id => (<select id={id} className={selectClass} value={form.ContactTypeID ?? ''} onChange={e => handleFormChange('ContactTypeID', e.target.value)}><option value="">Select…</option>{contactTypes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>
          <FormField label="Persona Type">{id => (<select id={id} className={selectClass} value={form.PersonaTypeID ?? ''} onChange={e => handleFormChange('PersonaTypeID', e.target.value)}><option value="">Select…</option>{personaTypes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>)}</FormField>

          <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Location</h3></div>
          <FormField label="City">{id => <input id={id} className={inputClass} value={form.City ?? ''} onChange={e => handleFormChange('City', e.target.value)} />}</FormField>
          <FormField label="State">{id => <input id={id} className={inputClass} value={form.State ?? ''} onChange={e => handleFormChange('State', e.target.value)} />}</FormField>
          <FormField label="Country">{id => <input id={id} className={inputClass} value={form.Country ?? ''} onChange={e => handleFormChange('Country', e.target.value)} />}</FormField>

          <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Relationship</h3></div>
          <FormField label="Relationship Owner">{id => <input id={id} className={inputClass} value={form.RelationshipOwner ?? ''} onChange={e => handleFormChange('RelationshipOwner', e.target.value)} />}</FormField>
          <FormField label="Communication Preference">{id => (<select id={id} className={selectClass} value={form.CommunicationPreference ?? ''} onChange={e => handleFormChange('CommunicationPreference', e.target.value)}><option value="">Select…</option><option value="Email">Email</option><option value="Phone">Phone</option><option value="In-Person">In-Person</option><option value="Video Call">Video Call</option></select>)}</FormField>
          <FormField label="Warmth Status">{id => (<select id={id} className={selectClass} value={form.WarmthStatus ?? ''} onChange={e => handleFormChange('WarmthStatus', e.target.value)}><option value="">Select…</option><option value="Cold">Cold</option><option value="Warm">Warm</option><option value="Hot">Hot</option></select>)}</FormField>
          <FormField label="Relationship Strength">{id => (<select id={id} className={selectClass} value={form.RelationshipStrength ?? ''} onChange={e => handleFormChange('RelationshipStrength', e.target.value)}><option value="">Select…</option><option value="Weak">Weak</option><option value="Developing">Developing</option><option value="Strong">Strong</option><option value="Very Strong">Very Strong</option></select>)}</FormField>

          <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Role Flags</h3></div>
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.DecisionMakerFlag === 'true'} onChange={e => handleFormChange('DecisionMakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Decision Maker</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ChampionFlag === 'true'} onChange={e => handleFormChange('ChampionFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Champion</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.DonorFlag === 'true'} onChange={e => handleFormChange('DonorFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Donor</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.SpeakerFlag === 'true'} onChange={e => handleFormChange('SpeakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Speaker</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.AdvisoryBoardFlag === 'true'} onChange={e => handleFormChange('AdvisoryBoardFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Advisory Board</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.HiringContactFlag === 'true'} onChange={e => handleFormChange('HiringContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Hiring Contact</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.InternshipContactFlag === 'true'} onChange={e => handleFormChange('InternshipContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Internship Contact</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ResearchContactFlag === 'true'} onChange={e => handleFormChange('ResearchContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Research Contact</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.LegislativeContactFlag === 'true'} onChange={e => handleFormChange('LegislativeContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Legislative Contact</label>
          </div>

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
