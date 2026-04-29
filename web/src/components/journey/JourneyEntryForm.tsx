'use client';

import { useState, useEffect } from 'react';
import type { JourneyLog } from '@/types';

export type JourneyFormData = {
  OrganizationID: number | '';
  ContactID?: number | '' | null;
  JourneyStageID: number | '';
  LogDate: string;
  EventType: string;
  Outcome: string;
  NextStep: string;
  NextStepDate: string;
  Owner: string;
  Notes: string;
  Summary: string;
};

const EMPTY_FORM: JourneyFormData = {
  OrganizationID: '',
  ContactID: null,
  JourneyStageID: '',
  LogDate: new Date().toISOString().slice(0, 10),
  EventType: '',
  Outcome: '',
  NextStep: '',
  NextStepDate: '',
  Owner: '',
  Notes: '',
  Summary: '',
};

const EVENT_TYPES = [
  'Meeting', 'Phone Call', 'Email', 'Site Visit', 'Conference',
  'Presentation', 'Workshop', 'Introduction', 'Follow-Up', 'Other',
];

type Props = {
  entry?: JourneyLog | null;
  organizations: { OrganizationID: number; OrganizationName: string }[];
  journeyStages: { id: number; name: string }[];
  onSave: (data: JourneyFormData) => Promise<void>;
  onCancel: () => void;
  fixedOrgId?: number;
  fixedContactId?: number;
  saving?: boolean;
};

export default function JourneyEntryForm({
  entry,
  organizations,
  journeyStages,
  onSave,
  onCancel,
  fixedOrgId,
  fixedContactId,
  saving = false,
}: Props) {
  const [form, setForm] = useState<JourneyFormData>(EMPTY_FORM);

  useEffect(() => {
    if (entry) {
      setForm({
        OrganizationID: entry.OrganizationID,
        ContactID: entry.ContactID ?? null,
        JourneyStageID: entry.JourneyStageID,
        LogDate: entry.LogDate ? entry.LogDate.slice(0, 10) : '',
        EventType: entry.EventType ?? '',
        Outcome: entry.Outcome ?? '',
        NextStep: entry.NextStep ?? '',
        NextStepDate: entry.NextStepDate ? entry.NextStepDate.slice(0, 10) : '',
        Owner: entry.Owner ?? '',
        Notes: entry.Notes ?? '',
        Summary: entry.Summary ?? '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        OrganizationID: fixedOrgId ?? '',
        ContactID: fixedContactId ?? null,
        LogDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [entry, fixedOrgId, fixedContactId]);

  function set(field: keyof JourneyFormData, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const canSave = form.OrganizationID && form.EventType && form.LogDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    await onSave(form);
  }

  const cls = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!fixedOrgId && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Organization *</label>
            <select className={cls} value={form.OrganizationID} onChange={e => set('OrganizationID', e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select organization…</option>
              {organizations.map(o => (
                <option key={o.OrganizationID} value={o.OrganizationID}>{o.OrganizationName}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Journey Stage</label>
          <select className={cls} value={form.JourneyStageID} onChange={e => set('JourneyStageID', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select stage…</option>
            {journeyStages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Date *</label>
          <input type="date" className={cls} value={form.LogDate} onChange={e => set('LogDate', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Event Type *</label>
          <select className={cls} value={form.EventType} onChange={e => set('EventType', e.target.value)}>
            <option value="">Select type…</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Owner</label>
          <input type="text" className={cls} placeholder="Who owns this?" value={form.Owner} onChange={e => set('Owner', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Follow-Up Date</label>
          <input type="date" className={cls} value={form.NextStepDate} onChange={e => set('NextStepDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Outcome</label>
        <input type="text" className={cls} placeholder="What was the result?" value={form.Outcome} onChange={e => set('Outcome', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Next Step</label>
        <input type="text" className={cls} placeholder="What happens next?" value={form.NextStep} onChange={e => set('NextStep', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
        <textarea className={cls} rows={3} placeholder="Additional notes…" value={form.Notes} onChange={e => set('Notes', e.target.value)} />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSave || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : entry ? 'Update Entry' : 'Add Entry'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
