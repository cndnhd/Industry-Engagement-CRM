'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StrategicRollup, RollupComponent, RollupContactRow, Contact } from '@/types';
import {
  fetchStrategicRollups,
  fetchStrategicRollup,
  createStrategicRollup,
  updateStrategicRollup,
  deleteStrategicRollup,
  fetchRollupComponents,
  createRollupComponent,
  deleteRollupComponent,
  fetchRollupContacts,
  addRollupContact,
  updateRollupContact,
  removeRollupContact,
  fetchContacts,
  fetchOrganizations,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import CollectionsSidebar from '@/components/layout/CollectionsSidebar';

export default function RollupsPage() {
  const [rollups, setRollups] = useState<StrategicRollup[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<StrategicRollup | null>(null);
  const [components, setComponents] = useState<RollupComponent[]>([]);
  const [contacts, setContacts] = useState<RollupContactRow[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [orgMap, setOrgMap] = useState<Map<number, string>>(new Map());

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [compLabel, setCompLabel] = useState('');

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactPick, setContactPick] = useState('');
  const [contactComponent, setContactComponent] = useState('');

  const [editDesc, setEditDesc] = useState('');

  const reloadRollups = useCallback(async () => {
    const rows = await fetchStrategicRollups();
    setRollups(rows);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, orgs] = await Promise.all([fetchContacts(), fetchOrganizations()]);
        setAllContacts(c);
        setOrgMap(new Map(orgs.map((o) => [o.OrganizationID, o.OrganizationName])));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    reloadRollups().catch(() => {});
  }, [reloadRollups]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setComponents([]);
      setContacts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const [d, comps, rc] = await Promise.all([
          fetchStrategicRollup(selectedId),
          fetchRollupComponents(selectedId),
          fetchRollupContacts(selectedId),
        ]);
        if (cancelled) return;
        setDetail(d);
        setEditDesc(d.Description ?? '');
        setComponents(comps);
        setContacts(rc);
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Failed to load rollup');
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const sidebarItems = useMemo(
    () => rollups.map((r) => ({ id: r.RollupID, name: r.Name })),
    [rollups],
  );

  async function handleCreate() {
    if (!newName.trim()) return;
    const r = await createStrategicRollup({ Name: newName.trim(), Description: newDesc.trim() || undefined });
    setRollups((p) => [...p, r].sort((a, b) => a.Name.localeCompare(b.Name)));
    setSelectedId(r.RollupID);
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
    setToast('Rollup created');
  }

  async function handleSaveDescription() {
    if (!selectedId) return;
    const u = await updateStrategicRollup(selectedId, { Description: editDesc });
    setDetail(u);
    setToast('Saved');
  }

  async function handleAddComponent() {
    if (!selectedId || !compLabel.trim()) return;
    const c = await createRollupComponent(selectedId, { Label: compLabel.trim(), SortOrder: components.length });
    setComponents((p) => [...p, c].sort((a, b) => a.SortOrder - b.SortOrder));
    setShowAddComponent(false);
    setCompLabel('');
    setToast('Component added');
  }

  async function handleDeleteComponent(id: number) {
    if (!selectedId || !confirm('Delete this component?')) return;
    await deleteRollupComponent(selectedId, id);
    setComponents((p) => p.filter((c) => c.ComponentID !== id));
    setToast('Component removed');
  }

  async function handleAddContact() {
    if (!selectedId || !contactPick) return;
    const cid = Number(contactPick);
    const compId = contactComponent ? Number(contactComponent) : undefined;
    await addRollupContact(selectedId, {
      ContactID: cid,
      ...(compId ? { ComponentID: compId } : {}),
    });
    const rc = await fetchRollupContacts(selectedId);
    setContacts(rc);
    setShowAddContact(false);
    setContactPick('');
    setContactComponent('');
    setToast('Contact linked');
  }

  async function handleContactComponentChange(contactId: number, componentId: string) {
    if (!selectedId) return;
    const v = componentId === '' ? null : Number(componentId);
    await updateRollupContact(selectedId, contactId, { ComponentID: v });
    setContacts((p) =>
      p.map((row) => (row.ContactID === contactId ? { ...row, ComponentID: v } : row)),
    );
  }

  async function handleRemoveContact(contactId: number) {
    if (!selectedId || !confirm('Remove contact from rollup?')) return;
    await removeRollupContact(selectedId, contactId);
    setContacts((p) => p.filter((r) => r.ContactID !== contactId));
    setToast('Contact removed');
  }

  async function handleDeleteRollup() {
    if (!selectedId || !confirm('Delete this strategic rollup?')) return;
    await deleteStrategicRollup(selectedId);
    setRollups((p) => p.filter((r) => r.RollupID !== selectedId));
    setSelectedId(null);
    setToast('Rollup deleted');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return <div className="py-16 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] gap-0">
      <CollectionsSidebar
        title="Rollups"
        items={sidebarItems}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setShowCreate(true)}
        createLabel="New rollup"
        emptyHint="Create a strategic rollup to track components and contacts."
      />
      <div className="min-w-0 flex-1 space-y-6 px-4 py-2">
        <PageHeader title="Strategic rollups" />

        {!selectedId || !detail ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Select a rollup or create one to record strategic reasoning and components.
          </div>
        ) : loadingDetail ? (
          <div className="py-20 text-center text-sm text-gray-500">Loading…</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{detail.Name}</h2>
                <p className="mt-1 text-xs text-gray-500">Strategic rollup · contacts and components</p>
              </div>
              <button
                type="button"
                onClick={handleDeleteRollup}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete rollup
              </button>
            </div>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <textarea
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Strategic reasoning, context, goals…"
              />
              <button
                type="button"
                onClick={handleSaveDescription}
                className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Save description
              </button>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Components</h3>
                <button
                  type="button"
                  onClick={() => setShowAddComponent(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Add component
                </button>
              </div>
              {components.length === 0 ? (
                <p className="text-sm text-gray-500">No components yet. Add tracks or workstreams.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {components.map((c) => (
                    <li key={c.ComponentID} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="font-medium text-gray-800">{c.Label}</span>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => handleDeleteComponent(c.ComponentID)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
                <button
                  type="button"
                  onClick={() => setShowAddContact(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Link contact
                </button>
              </div>
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500">No contacts linked.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80">
                        <th className="px-3 py-2 font-semibold text-gray-700">Name</th>
                        <th className="px-3 py-2 font-semibold text-gray-700">Organization</th>
                        <th className="px-3 py-2 font-semibold text-gray-700">Component</th>
                        <th className="px-3 py-2 font-semibold text-gray-700" />
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((row) => (
                        <tr key={row.ContactID} className="border-b border-gray-100">
                          <td className="px-3 py-2">
                            {row.FirstName} {row.LastName}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {row.OrganizationID != null ? orgMap.get(row.OrganizationID) ?? '—' : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className={`${selectClass} max-w-xs`}
                              value={row.ComponentID ?? ''}
                              onChange={(e) => handleContactComponentChange(row.ContactID, e.target.value)}
                              aria-label={`Component for ${row.FirstName} ${row.LastName}`}
                            >
                              <option value="">—</option>
                              {components.map((c) => (
                                <option key={c.ComponentID} value={c.ComponentID}>
                                  {c.Label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => handleRemoveContact(row.ContactID)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New strategic rollup">
        <div className="space-y-4">
          <FormField label="Name" required>
            {(id) => <input id={id} className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} />}
          </FormField>
          <FormField label="Description">
            {(id) => (
              <textarea id={id} className={inputClass} rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleCreate}>
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddComponent} onClose={() => setShowAddComponent(false)} title="Add component">
        <div className="space-y-4">
          <FormField label="Label" required>
            {(id) => <input id={id} className={inputClass} value={compLabel} onChange={(e) => setCompLabel(e.target.value)} />}
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowAddComponent(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleAddComponent}>
              Add
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddContact} onClose={() => setShowAddContact(false)} title="Link contact">
        <div className="space-y-4">
          <FormField label="Contact">
            {(id) => (
              <select id={id} className={selectClass} value={contactPick} onChange={(e) => setContactPick(e.target.value)}>
                <option value="">Select…</option>
                {allContacts
                  .filter((c) => !contacts.some((r) => r.ContactID === c.ContactID))
                  .map((c) => (
                    <option key={c.ContactID} value={c.ContactID}>
                      {c.FirstName} {c.LastName}
                    </option>
                  ))}
              </select>
            )}
          </FormField>
          {components.length > 0 && (
            <FormField label="Component (optional)">
              {(id) => (
                <select id={id} className={selectClass} value={contactComponent} onChange={(e) => setContactComponent(e.target.value)}>
                  <option value="">—</option>
                  {components.map((c) => (
                    <option key={c.ComponentID} value={c.ComponentID}>
                      {c.Label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowAddContact(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleAddContact}>
              Link
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}
