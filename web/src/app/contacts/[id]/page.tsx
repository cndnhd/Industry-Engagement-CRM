'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchContact,
  updateContact,
  deleteContact,
  fetchOrganizations,
  fetchJourneyLogs,
  createJourneyLog,
  updateJourneyLog,
  deleteJourneyLog,
  loadLookup,
  resolveName,
  fetchContactsByOrg,
} from '@/lib/api';
import type { Contact, Organization, LookupItem, JourneyLog } from '@/types';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import Badge from '@/components/ui/Badge';
import JourneyTimeline from '@/components/journey/JourneyTimeline';
import JourneyEntryForm, { type JourneyFormData } from '@/components/journey/JourneyEntryForm';

const STRENGTH_LABELS: Record<number, string> = { 1: 'Weak', 2: 'Developing', 3: 'Strong', 4: 'Very Strong' };

type Tab = 'activity' | 'details';
type JourneyLogRow = JourneyLog & { JourneyStageName?: string; OrganizationName?: string };
type Toast = { message: string; type: 'success' | 'error' };

const ROLE_FLAGS: { key: keyof Contact; label: string; color: React.ComponentProps<typeof Badge>['color'] }[] = [
  { key: 'DecisionMakerFlag', label: 'Decision Maker', color: 'indigo' },
  { key: 'ChampionFlag', label: 'Champion', color: 'emerald' },
  { key: 'DonorFlag', label: 'Donor', color: 'amber' },
  { key: 'SpeakerFlag', label: 'Speaker', color: 'purple' },
  { key: 'AdvisoryBoardFlag', label: 'Advisory Board', color: 'blue' },
  { key: 'HiringContactFlag', label: 'Hiring', color: 'cyan' },
  { key: 'InternshipContactFlag', label: 'Internship', color: 'rose' },
  { key: 'ResearchContactFlag', label: 'Research', color: 'red' },
  { key: 'LegislativeContactFlag', label: 'Legislative', color: 'slate' },
];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = Number(params.id);

  const [contact, setContact] = useState<Contact | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<LookupItem[]>([]);
  const [influenceLevels, setInfluenceLevels] = useState<LookupItem[]>([]);
  const [riskTolerances, setRiskTolerances] = useState<LookupItem[]>([]);
  const [personalOrientations, setPersonalOrientations] = useState<LookupItem[]>([]);
  const [seniorityLevels, setSeniorityLevels] = useState<LookupItem[]>([]);
  const [contactTypes, setContactTypes] = useState<LookupItem[]>([]);
  const [personaTypes, setPersonaTypes] = useState<LookupItem[]>([]);
  const [journeyStages, setJourneyStages] = useState<LookupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('activity');

  const [journeyLogs, setJourneyLogs] = useState<JourneyLogRow[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JourneyLog | null>(null);
  const [activitySaving, setActivitySaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function load() {
      try {
        const [c, orgList, fa, il, rt, po, sl, ct, pt, js] = await Promise.all([
          fetchContact(contactId),
          fetchOrganizations(),
          loadLookup('functionalAreas'),
          loadLookup('influenceLevels'),
          loadLookup('riskToleranceLevels'),
          loadLookup('personalOrientations'),
          loadLookup('seniorityLevels'),
          loadLookup('contactTypes'),
          loadLookup('personaTypes'),
          loadLookup('journeyStages'),
        ]);
        setContact(c);
        setOrgs(orgList);
        setFunctionalAreas(fa);
        setInfluenceLevels(il);
        setRiskTolerances(rt);
        setPersonalOrientations(po);
        setSeniorityLevels(sl);
        setContactTypes(ct);
        setPersonaTypes(pt);
        setJourneyStages(js);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contactId]);

  const loadJourneyLogs = useCallback(async () => {
    setJourneyLoading(true);
    try {
      const all = await fetchJourneyLogs();
      const filtered = all
        .filter((j) => j.ContactID === contactId)
        .map((j) => ({
          ...j,
          JourneyStageName: resolveName(journeyStages, j.JourneyStageID),
        }));
      filtered.sort((a, b) => new Date(b.LogDate ?? '').getTime() - new Date(a.LogDate ?? '').getTime());
      setJourneyLogs(filtered);
    } catch {
      setJourneyLogs([]);
    } finally {
      setJourneyLoading(false);
    }
  }, [contactId, journeyStages]);

  useEffect(() => {
    if (!loading && contact && activeTab === 'activity') {
      loadJourneyLogs();
    }
  }, [loading, contact, activeTab, loadJourneyLogs]);

  const orgMap = new Map(orgs.map((o) => [o.OrganizationID, o.OrganizationName]));

  function openEditModal() {
    if (!contact) return;
    setEditForm({
      FirstName: contact.FirstName ?? '',
      LastName: contact.LastName ?? '',
      Title: contact.Title ?? '',
      Email: contact.Email ?? '',
      Phone: contact.Phone ?? '',
      WorkPhone: contact.WorkPhone ?? '',
      CellPhone: contact.CellPhone ?? '',
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
      RelationshipStrength: contact.RelationshipStrength != null
        ? (STRENGTH_LABELS[contact.RelationshipStrength] ?? String(contact.RelationshipStrength))
        : '',
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

  const handleEditFormChange = (key: string, value: string) =>
    setEditForm((f) => ({ ...f, [key]: value }));

  async function handleSaveEdit() {
    if (!contact) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: editForm.FirstName,
        LastName: editForm.LastName,
        Email: editForm.Email || null,
        Phone: editForm.Phone || null,
        WorkPhone: editForm.WorkPhone || null,
        CellPhone: editForm.CellPhone || null,
        Title: editForm.Title || null,
        Notes: editForm.Notes || null,
        OrganizationID: editForm.OrganizationID ? Number(editForm.OrganizationID) : null,
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
        Alumni: editForm.Alumni === '1',
        ClearanceFamiliarity: editForm.ClearanceFamiliarity === '1',
        IsPrimaryContact: editForm.IsPrimaryContact === '1',
      };
      const updated = await updateContact(contactId, body);
      setContact(updated);
      setShowEdit(false);
      setToast({ message: 'Contact updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update contact', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) return;
    setSaving(true);
    try {
      await deleteContact(contactId);
      router.push('/contacts');
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete contact', type: 'error' });
      setSaving(false);
    }
  }

  async function handleSaveActivity(data: JourneyFormData) {
    setActivitySaving(true);
    try {
      if (editingEntry) {
        await updateJourneyLog(editingEntry.JourneyLogID, {
          OrganizationID: data.OrganizationID || contact?.OrganizationID || null,
          ContactID: contactId,
          JourneyStageID: data.JourneyStageID || null,
          LogDate: data.LogDate || null,
          EventType: data.EventType || null,
          Outcome: data.Outcome || null,
          NextStep: data.NextStep || null,
          NextStepDate: data.NextStepDate || null,
          Owner: data.Owner || null,
          Notes: data.Notes || null,
          Summary: data.Summary || null,
        });
        setToast({ message: 'Activity updated', type: 'success' });
      } else {
        await createJourneyLog({
          OrganizationID: contact?.OrganizationID || null,
          ContactID: contactId,
          JourneyStageID: data.JourneyStageID || null,
          LogDate: data.LogDate || null,
          EventType: data.EventType || null,
          Outcome: data.Outcome || null,
          NextStep: data.NextStep || null,
          NextStepDate: data.NextStepDate || null,
          Owner: data.Owner || null,
          Notes: data.Notes || null,
          Summary: data.Summary || null,
        });
        setToast({ message: 'Activity added', type: 'success' });
      }
      setShowAddActivity(false);
      setEditingEntry(null);
      await loadJourneyLogs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to save activity', type: 'error' });
    } finally {
      setActivitySaving(false);
    }
  }

  async function handleDeleteActivity(id: number) {
    try {
      await deleteJourneyLog(id);
      setToast({ message: 'Activity deleted', type: 'success' });
      await loadJourneyLogs();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete activity', type: 'error' });
    }
  }

  function handleEditActivity(entry: JourneyLog) {
    setEditingEntry(entry);
    setShowAddActivity(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-sm">{error ?? 'Contact not found'}</div>
      </div>
    );
  }

  const activeRoleFlags = ROLE_FLAGS.filter((f) => contact[f.key]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Contacts
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">
          {contact.FirstName} {contact.LastName}
        </h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Delete Contact
        </button>
        <button
          onClick={openEditModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit
        </button>
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Contact Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <DetailField label="Name" value={`${contact.FirstName} ${contact.LastName}`} />
          <DetailField
            label="Organization"
            value={
              contact.OrganizationID ? (
                <Link href={`/organizations/${contact.OrganizationID}`} className="text-blue-600 hover:underline">
                  {orgMap.get(contact.OrganizationID) ?? '—'}
                </Link>
              ) : undefined
            }
          />
          <DetailField label="Title" value={contact.Title} />
          <DetailField label="Email" value={contact.Email} />
          <DetailField label="Work Phone" value={contact.WorkPhone} />
          <DetailField label="Cell Phone" value={contact.CellPhone} />
          <DetailField label="Phone (legacy)" value={contact.Phone} />
          <DetailField label="Office Phone" value={contact.OfficePhone} />
          <DetailField label="Functional Area" value={resolveName(functionalAreas, contact.FunctionalAreaID)} />
          <DetailField label="Influence Level" value={resolveName(influenceLevels, contact.InfluenceLevelID)} />
          <DetailField label="Risk Tolerance" value={resolveName(riskTolerances, contact.RiskToleranceID)} />
          <DetailField label="Personal Orientation" value={resolveName(personalOrientations, contact.PersonalOrientationID)} />
          <DetailField label="Department" value={contact.Department} />
          <DetailField label="Seniority" value={resolveName(seniorityLevels, contact.SeniorityLevelID)} />
          <DetailField label="Contact Type" value={resolveName(contactTypes, contact.ContactTypeID)} />
          <DetailField label="Persona Type" value={resolveName(personaTypes, contact.PersonaTypeID)} />
          <DetailField label="City" value={contact.City} />
          <DetailField label="State" value={contact.State} />
          <DetailField label="Country" value={contact.Country} />
          <DetailField label="Communication Preference" value={contact.CommunicationPreference} />
          <DetailField label="Warmth" value={contact.WarmthStatus} />
          <DetailField
            label="Relationship Strength"
            value={contact.RelationshipStrength != null ? (STRENGTH_LABELS[contact.RelationshipStrength] ?? String(contact.RelationshipStrength)) : undefined}
          />
          <DetailField label="Relationship Owner" value={contact.RelationshipOwner} />
          <DetailField label="Alumni" value={contact.Alumni ? 'Yes' : 'No'} />
          <DetailField label="Clearance Familiarity" value={contact.ClearanceFamiliarity ? 'Yes' : 'No'} />
          <DetailField label="Primary Contact" value={contact.IsPrimaryContact ? 'Yes' : 'No'} />
        </dl>

        {activeRoleFlags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Role Flags</h3>
            <div className="flex flex-wrap gap-2">
              {activeRoleFlags.map((f) => (
                <Badge key={f.key} label={f.label} color={f.color} size="sm" />
              ))}
            </div>
          </div>
        )}

        {contact.Notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{contact.Notes}</p>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {([{ key: 'activity', label: 'Activity Log' }, { key: 'details', label: 'Details' }] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl ring-1 ring-gray-950/5 shadow-sm p-6 min-h-[200px]">
        {activeTab === 'activity' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Activity Log</h3>
              <button
                onClick={() => { setEditingEntry(null); setShowAddActivity((v) => !v); }}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {showAddActivity && !editingEntry ? 'Cancel' : 'Add Activity'}
              </button>
            </div>

            {showAddActivity && (
              <div className="mb-6 rounded-lg border border-gray-200 p-4">
                <JourneyEntryForm
                  entry={editingEntry}
                  organizations={orgs.map((o) => ({ OrganizationID: o.OrganizationID, OrganizationName: o.OrganizationName }))}
                  journeyStages={journeyStages}
                  onSave={handleSaveActivity}
                  onCancel={() => { setShowAddActivity(false); setEditingEntry(null); }}
                  fixedOrgId={contact.OrganizationID}
                  fixedContactId={contactId}
                  saving={activitySaving}
                />
              </div>
            )}

            {journeyLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <JourneyTimeline
                entries={journeyLogs}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
              />
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Extended Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <DetailField label="Prefix" value={contact.Prefix} />
              <DetailField label="Preferred Name" value={contact.PreferredName} />
              <DetailField label="Secondary Email" value={contact.SecondaryEmail} />
              <DetailField label="LinkedIn URL" value={contact.LinkedInURL} />
              <DetailField
                label="Last Contact Date"
                value={contact.LastContactDate ? new Date(contact.LastContactDate).toLocaleDateString() : undefined}
              />
              <DetailField
                label="Next Follow-Up"
                value={contact.NextFollowUpDate ? new Date(contact.NextFollowUpDate).toLocaleDateString() : undefined}
              />
              <DetailField
                label="Created"
                value={contact.CreatedAt ? new Date(contact.CreatedAt).toLocaleDateString() : undefined}
              />
              <DetailField
                label="Updated"
                value={contact.UpdatedAt ? new Date(contact.UpdatedAt).toLocaleDateString() : undefined}
              />
            </dl>
          </div>
        )}
      </div>

      {/* Edit Contact Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Contact" size="xl">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              {(id) => <input id={id} className={inputClass} value={editForm.FirstName ?? ''} onChange={(e) => handleEditFormChange('FirstName', e.target.value)} />}
            </FormField>
            <FormField label="Last Name" required>
              {(id) => <input id={id} className={inputClass} value={editForm.LastName ?? ''} onChange={(e) => handleEditFormChange('LastName', e.target.value)} />}
            </FormField>
            <FormField label="Title">
              {(id) => <input id={id} className={inputClass} value={editForm.Title ?? ''} onChange={(e) => handleEditFormChange('Title', e.target.value)} />}
            </FormField>
            <FormField label="Email">
              {(id) => <input id={id} type="email" className={inputClass} value={editForm.Email ?? ''} onChange={(e) => handleEditFormChange('Email', e.target.value)} />}
            </FormField>
            <FormField label="Work Phone">
              {(id) => <input id={id} className={inputClass} value={editForm.WorkPhone ?? ''} onChange={(e) => handleEditFormChange('WorkPhone', e.target.value)} />}
            </FormField>
            <FormField label="Cell Phone">
              {(id) => <input id={id} className={inputClass} value={editForm.CellPhone ?? ''} onChange={(e) => handleEditFormChange('CellPhone', e.target.value)} />}
            </FormField>
            <FormField label="Phone (legacy)">
              {(id) => <input id={id} className={inputClass} value={editForm.Phone ?? ''} onChange={(e) => handleEditFormChange('Phone', e.target.value)} />}
            </FormField>
            <FormField label="Organization">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.OrganizationID ?? ''} onChange={(e) => handleEditFormChange('OrganizationID', e.target.value)}>
                  <option value="">Select…</option>
                  {orgs.map((o) => <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Functional Area">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.FunctionalAreaID ?? ''} onChange={(e) => handleEditFormChange('FunctionalAreaID', e.target.value)}>
                  <option value="">Select…</option>
                  {functionalAreas.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Influence Level">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.InfluenceLevelID ?? ''} onChange={(e) => handleEditFormChange('InfluenceLevelID', e.target.value)}>
                  <option value="">Select…</option>
                  {influenceLevels.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Risk Tolerance">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.RiskToleranceID ?? ''} onChange={(e) => handleEditFormChange('RiskToleranceID', e.target.value)}>
                  <option value="">Select…</option>
                  {riskTolerances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Personal Orientation">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.PersonalOrientationID ?? ''} onChange={(e) => handleEditFormChange('PersonalOrientationID', e.target.value)}>
                  <option value="">Select…</option>
                  {personalOrientations.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>

            <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Name Details</h3></div>
            <FormField label="Prefix">
              {(id) => <input id={id} className={inputClass} value={editForm.Prefix ?? ''} onChange={(e) => handleEditFormChange('Prefix', e.target.value)} />}
            </FormField>
            <FormField label="Preferred Name">
              {(id) => <input id={id} className={inputClass} value={editForm.PreferredName ?? ''} onChange={(e) => handleEditFormChange('PreferredName', e.target.value)} />}
            </FormField>

            <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Contact Details</h3></div>
            <FormField label="Secondary Email">
              {(id) => <input id={id} type="email" className={inputClass} value={editForm.SecondaryEmail ?? ''} onChange={(e) => handleEditFormChange('SecondaryEmail', e.target.value)} />}
            </FormField>
            <FormField label="Office Phone">
              {(id) => <input id={id} className={inputClass} value={editForm.OfficePhone ?? ''} onChange={(e) => handleEditFormChange('OfficePhone', e.target.value)} />}
            </FormField>
            <FormField label="LinkedIn URL">
              {(id) => <input id={id} className={inputClass} value={editForm.LinkedInURL ?? ''} onChange={(e) => handleEditFormChange('LinkedInURL', e.target.value)} />}
            </FormField>
            <FormField label="Department">
              {(id) => <input id={id} className={inputClass} value={editForm.Department ?? ''} onChange={(e) => handleEditFormChange('Department', e.target.value)} />}
            </FormField>
            <FormField label="Seniority Level">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.SeniorityLevelID ?? ''} onChange={(e) => handleEditFormChange('SeniorityLevelID', e.target.value)}>
                  <option value="">Select…</option>
                  {seniorityLevels.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Contact Type">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.ContactTypeID ?? ''} onChange={(e) => handleEditFormChange('ContactTypeID', e.target.value)}>
                  <option value="">Select…</option>
                  {contactTypes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Persona Type">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.PersonaTypeID ?? ''} onChange={(e) => handleEditFormChange('PersonaTypeID', e.target.value)}>
                  <option value="">Select…</option>
                  {personaTypes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </FormField>

            <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Location</h3></div>
            <FormField label="City">
              {(id) => <input id={id} className={inputClass} value={editForm.City ?? ''} onChange={(e) => handleEditFormChange('City', e.target.value)} />}
            </FormField>
            <FormField label="State">
              {(id) => <input id={id} className={inputClass} value={editForm.State ?? ''} onChange={(e) => handleEditFormChange('State', e.target.value)} />}
            </FormField>
            <FormField label="Country">
              {(id) => <input id={id} className={inputClass} value={editForm.Country ?? ''} onChange={(e) => handleEditFormChange('Country', e.target.value)} />}
            </FormField>

            <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Relationship</h3></div>
            <FormField label="Relationship Owner">
              {(id) => <input id={id} className={inputClass} value={editForm.RelationshipOwner ?? ''} onChange={(e) => handleEditFormChange('RelationshipOwner', e.target.value)} />}
            </FormField>
            <FormField label="Communication Preference">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.CommunicationPreference ?? ''} onChange={(e) => handleEditFormChange('CommunicationPreference', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Video Call">Video Call</option>
                </select>
              )}
            </FormField>
            <FormField label="Warmth Status">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.WarmthStatus ?? ''} onChange={(e) => handleEditFormChange('WarmthStatus', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Cold">Cold</option>
                  <option value="Warm">Warm</option>
                  <option value="Hot">Hot</option>
                </select>
              )}
            </FormField>
            <FormField label="Relationship Strength">
              {(id) => (
                <select id={id} className={selectClass} value={editForm.RelationshipStrength ?? ''} onChange={(e) => handleEditFormChange('RelationshipStrength', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Weak">Weak</option>
                  <option value="Developing">Developing</option>
                  <option value="Strong">Strong</option>
                  <option value="Very Strong">Very Strong</option>
                </select>
              )}
            </FormField>

            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.Alumni === '1'} onChange={(e) => setEditForm((f) => ({ ...f, Alumni: e.target.checked ? '1' : '0' }))} />
                Alumni
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.ClearanceFamiliarity === '1'} onChange={(e) => setEditForm((f) => ({ ...f, ClearanceFamiliarity: e.target.checked ? '1' : '0' }))} />
                Clearance Familiarity
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={editForm.IsPrimaryContact === '1'} onChange={(e) => setEditForm((f) => ({ ...f, IsPrimaryContact: e.target.checked ? '1' : '0' }))} />
                Primary Contact
              </label>
            </div>

            <div className="col-span-2"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Role Flags</h3></div>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.DecisionMakerFlag === 'true'} onChange={(e) => handleEditFormChange('DecisionMakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Decision Maker</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.ChampionFlag === 'true'} onChange={(e) => handleEditFormChange('ChampionFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Champion</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.DonorFlag === 'true'} onChange={(e) => handleEditFormChange('DonorFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Donor</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.SpeakerFlag === 'true'} onChange={(e) => handleEditFormChange('SpeakerFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Speaker</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.AdvisoryBoardFlag === 'true'} onChange={(e) => handleEditFormChange('AdvisoryBoardFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Advisory Board</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.HiringContactFlag === 'true'} onChange={(e) => handleEditFormChange('HiringContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Hiring Contact</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.InternshipContactFlag === 'true'} onChange={(e) => handleEditFormChange('InternshipContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Internship Contact</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.ResearchContactFlag === 'true'} onChange={(e) => handleEditFormChange('ResearchContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Research Contact</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.LegislativeContactFlag === 'true'} onChange={(e) => handleEditFormChange('LegislativeContactFlag', e.target.checked ? 'true' : 'false')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Legislative Contact</label>
            </div>

            <div className="col-span-2">
              <FormField label="Notes">
                {(id) => <textarea id={id} rows={3} className={inputClass} value={editForm.Notes ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, Notes: e.target.value }))} />}
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !editForm.FirstName || !editForm.LastName}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}
