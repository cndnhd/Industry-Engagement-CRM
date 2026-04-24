'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Contact, Organization, UserList, UserListColumn, ListMembershipRow } from '@/types';
import {
  fetchContacts,
  fetchOrganizations,
  fetchUserLists,
  fetchUserList,
  updateUserList,
  deleteUserList,
  fetchListColumns,
  createUserList,
  createListColumn,
  fetchListMemberships,
  addListMembership,
  removeListMembership,
  patchListMembershipCells,
  loadLookup,
  resolveName,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import CollectionsSidebar from '@/components/layout/CollectionsSidebar';
import {
  EnhancedDataGrid,
  type GridColumn,
  type RollupDimension,
  type ActiveFilter,
  type GridPreset,
} from '@/components/grid';
import type { GridSnapshot } from '@/components/grid/EnhancedDataGrid';

function parseListPreset(list: UserList): GridPreset {
  let filters: ActiveFilter[] = [];
  let columnVisibility: Record<string, boolean> | null = null;
  try {
    if (list.FilterJson) {
      const f = JSON.parse(list.FilterJson);
      if (Array.isArray(f)) filters = f;
    }
  } catch {
    /* ignore */
  }
  try {
    if (list.VisibleColumnKeysJson) {
      columnVisibility = JSON.parse(list.VisibleColumnKeysJson);
    }
  } catch {
    /* ignore */
  }
  return { filters, search: '', columnVisibility };
}

function LevelPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`min-w-[1.5rem] rounded px-1 py-0.5 text-xs font-medium transition ${
            value === n ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

type ListContactRow = Contact & { _membershipId: number; _cells: Record<number, number> };
type ListOrgRow = Organization & { _membershipId: number; _cells: Record<number, number> };

export default function ListsPage() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listDetail, setListDetail] = useState<UserList | null>(null);
  const [listColumns, setListColumns] = useState<UserListColumn[]>([]);
  const [memberships, setMemberships] = useState<ListMembershipRow[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgLookups, setOrgLookups] = useState<Record<string, Awaited<ReturnType<typeof loadLookup>>>>({});

  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEntity, setNewListEntity] = useState<'C' | 'O'>('C');

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [colLabel, setColLabel] = useState('');
  const [colTier, setColTier] = useState('3');

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberPick, setMemberPick] = useState('');

  const gridSnapshotRef = useRef<GridSnapshot | null>(null);

  const reloadLists = useCallback(async () => {
    const rows = await fetchUserLists();
    setLists(rows);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, o, orgTypes, pri, rel] = await Promise.all([
          fetchContacts(),
          fetchOrganizations(),
          loadLookup('orgTypes'),
          loadLookup('priorityLevels'),
          loadLookup('relationshipLevels'),
        ]);
        setContacts(c);
        setOrgs(o);
        setOrgLookups({ orgTypes, priorityLevels: pri, relationshipLevels: rel });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    reloadLists().catch(() => {});
  }, [reloadLists]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selectedId) {
      setListDetail(null);
      setListColumns([]);
      setMemberships([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const [detail, cols, mem] = await Promise.all([
          fetchUserList(selectedId),
          fetchListColumns(selectedId),
          fetchListMemberships(selectedId),
        ]);
        if (cancelled) return;
        setListDetail(detail);
        setListColumns(cols);
        setMemberships(mem);
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Failed to load list');
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const orgMap = useMemo(() => new Map(orgs.map((o) => [o.OrganizationID, o.OrganizationName])), [orgs]);

  const contactRows: ListContactRow[] = useMemo(() => {
    if (!listDetail || listDetail.EntityType !== 'C') return [];
    const cmap = new Map(contacts.map((c) => [c.ContactID, c]));
    return memberships
      .filter((m) => m.contactId != null)
      .map((m) => {
        const c = cmap.get(m.contactId!);
        if (!c) return null;
        return { ...c, _membershipId: m.membershipId, _cells: { ...m.cells } };
      })
      .filter(Boolean) as ListContactRow[];
  }, [listDetail, memberships, contacts]);

  const orgRows: ListOrgRow[] = useMemo(() => {
    if (!listDetail || listDetail.EntityType !== 'O') return [];
    const omap = new Map(orgs.map((o) => [o.OrganizationID, o]));
    return memberships
      .filter((m) => m.organizationId != null)
      .map((m) => {
        const o = omap.get(m.organizationId!);
        if (!o) return null;
        return { ...o, _membershipId: m.membershipId, _cells: { ...m.cells } };
      })
      .filter(Boolean) as ListOrgRow[];
  }, [listDetail, memberships, orgs]);

  const handleCell = useCallback(
    async (membershipId: number, columnId: number, completionLevel: number) => {
      if (!selectedId) return;
      await patchListMembershipCells(selectedId, membershipId, [{ columnId, completionLevel }]);
      setMemberships((prev) =>
        prev.map((m) =>
          m.membershipId === membershipId
            ? { ...m, cells: { ...m.cells, [columnId]: completionLevel } }
            : m,
        ),
      );
    },
    [selectedId],
  );

  const contactGridColumns: GridColumn<ListContactRow>[] = useMemo(() => {
    const base: GridColumn<ListContactRow>[] = [
      {
        key: 'FullName',
        header: 'Name',
        type: 'string',
        sortable: true,
        searchable: true,
        render: (c) => (
          <span className="font-medium text-gray-900">
            {c.FirstName} {c.LastName}
          </span>
        ),
        getValue: (c) => `${c.FirstName} ${c.LastName}`,
      },
      {
        key: 'Organization',
        header: 'Organization',
        type: 'lookup',
        sortable: true,
        searchable: true,
        filterable: true,
        filterOptions: [...new Set(contactRows.map((c) => orgMap.get(c.OrganizationID!) ?? '').filter(Boolean))]
          .sort()
          .map((n) => ({ value: n.toLowerCase(), label: n })),
        render: (c) => orgMap.get(c.OrganizationID!) ?? '—',
        getValue: (c) => orgMap.get(c.OrganizationID!) ?? '',
      },
      {
        key: 'Title',
        header: 'Title',
        type: 'string',
        sortable: true,
        searchable: true,
        getValue: (c) => c.Title ?? '',
      },
      {
        key: 'Email',
        header: 'Email',
        type: 'string',
        searchable: true,
        getValue: (c) => c.Email ?? '',
      },
      {
        key: 'Actions',
        header: '',
        sortable: false,
        searchable: false,
        defaultVisible: true,
        render: (c) => (
          <button
            type="button"
            className="text-xs font-medium text-red-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              removeListMembership(selectedId!, c._membershipId).then(() => {
                setMemberships((p) => p.filter((m) => m.membershipId !== c._membershipId));
                setToast('Removed from list');
              });
            }}
          >
            Remove
          </button>
        ),
        getValue: () => '',
      },
    ];

    const dyn: GridColumn<ListContactRow>[] = listColumns.map((lc) => ({
      key: `pc_${lc.ColumnID}`,
      header: `${lc.Label} (T${lc.ProcessTier})`,
      type: 'number',
      sortable: true,
      defaultVisible: true,
      render: (row) => (
        <LevelPicker
          value={row._cells[lc.ColumnID] ?? 1}
          onChange={(n) => handleCell(row._membershipId, lc.ColumnID, n)}
        />
      ),
      getValue: (row) => row._cells[lc.ColumnID] ?? 1,
    }));

    return [...base.slice(0, -1), ...dyn, base[base.length - 1]];
  }, [contactRows, orgMap, listColumns, handleCell, selectedId]);

  const orgGridColumns: GridColumn<ListOrgRow>[] = useMemo(() => {
    const { orgTypes, priorityLevels, relationshipLevels } = orgLookups;
    const base: GridColumn<ListOrgRow>[] = [
      {
        key: 'OrganizationName',
        header: 'Organization',
        type: 'string',
        sortable: true,
        searchable: true,
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
        type: 'string',
        sortable: true,
        searchable: true,
        render: (row) => [row.City, row.State].filter(Boolean).join(', ') || '—',
        getValue: (row) => [row.City, row.State].filter(Boolean).join(', '),
      },
      {
        key: 'Priority',
        header: 'Priority',
        type: 'lookup',
        filterable: true,
        filterOptions: (priorityLevels ?? []).map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (row) => resolveName(priorityLevels ?? [], row.PriorityLevelID),
        getValue: (row) => resolveName(priorityLevels ?? [], row.PriorityLevelID),
      },
      {
        key: 'OrgType',
        header: 'Type',
        type: 'lookup',
        filterable: true,
        filterOptions: (orgTypes ?? []).map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (row) => resolveName(orgTypes ?? [], row.OrgTypeID),
        getValue: (row) => resolveName(orgTypes ?? [], row.OrgTypeID),
      },
      {
        key: 'Relationship',
        header: 'Relationship',
        type: 'lookup',
        filterable: true,
        filterOptions: (relationshipLevels ?? []).map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (row) => resolveName(relationshipLevels ?? [], row.RelationshipLevelID),
        getValue: (row) => resolveName(relationshipLevels ?? [], row.RelationshipLevelID),
      },
      {
        key: 'Actions',
        header: '',
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="text-xs font-medium text-red-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              removeListMembership(selectedId!, row._membershipId).then(() => {
                setMemberships((p) => p.filter((m) => m.membershipId !== row._membershipId));
                setToast('Removed from list');
              });
            }}
          >
            Remove
          </button>
        ),
        getValue: () => '',
      },
    ];

    const dyn: GridColumn<ListOrgRow>[] = listColumns.map((lc) => ({
      key: `pc_${lc.ColumnID}`,
      header: `${lc.Label} (T${lc.ProcessTier})`,
      type: 'number',
      sortable: true,
      defaultVisible: true,
      render: (row) => (
        <LevelPicker
          value={row._cells[lc.ColumnID] ?? 1}
          onChange={(n) => handleCell(row._membershipId, lc.ColumnID, n)}
        />
      ),
      getValue: (row) => row._cells[lc.ColumnID] ?? 1,
    }));

    return [...base.slice(0, -1), ...dyn, base[base.length - 1]];
  }, [listColumns, handleCell, selectedId, orgLookups]);

  const rollupDimensions: RollupDimension[] = useMemo(() => {
    if (!listDetail) return [];
    if (listDetail.EntityType === 'C') {
      return [
        { key: 'org', label: 'Organization', getGroup: (item: unknown) => orgMap.get((item as ListContactRow).OrganizationID!) ?? '(none)' },
        ...listColumns.map((lc) => ({
          key: `pc_${lc.ColumnID}`,
          label: lc.Label,
          getGroup: (item: unknown) => String((item as ListContactRow)._cells[lc.ColumnID] ?? '—'),
        })),
      ];
    }
    return listColumns.map((lc) => ({
      key: `pc_${lc.ColumnID}`,
      label: lc.Label,
      getGroup: (item: unknown) => String((item as ListOrgRow)._cells[lc.ColumnID] ?? '—'),
    }));
  }, [listDetail, listColumns, orgMap]);

  async function handleCreateList() {
    if (!newListName.trim()) return;
    const created = await createUserList({ Name: newListName.trim(), EntityType: newListEntity });
    setLists((p) => [...p, created].sort((a, b) => a.Name.localeCompare(b.Name)));
    setSelectedId(created.ListID);
    setShowCreateList(false);
    setNewListName('');
    setToast('List created');
  }

  async function handleAddColumn() {
    if (!selectedId || !colLabel.trim()) return;
    const tier = Number(colTier);
    if (tier < 1 || tier > 5) return;
    const col = await createListColumn(selectedId, {
      Label: colLabel.trim(),
      ProcessTier: tier,
      SortOrder: listColumns.length,
    });
    setListColumns((p) => [...p, col].sort((a, b) => a.SortOrder - b.SortOrder));
    setShowAddColumn(false);
    setColLabel('');
    setColTier('3');
    setToast('Column added');
  }

  async function handleAddMember() {
    if (!selectedId || !memberPick) return;
    const id = Number(memberPick);
    if (!listDetail) return;
    if (listDetail.EntityType === 'C') {
      await addListMembership(selectedId, { ContactID: id });
    } else {
      await addListMembership(selectedId, { OrganizationID: id });
    }
    const mem = await fetchListMemberships(selectedId);
    setMemberships(mem);
    setShowAddMember(false);
    setMemberPick('');
    setToast('Added to list');
  }

  async function saveViewToList() {
    if (!selectedId || !listDetail || !gridSnapshotRef.current) return;
    const s = gridSnapshotRef.current;
    const updated = await updateUserList(selectedId, {
      FilterJson: JSON.stringify(s.activeFilters),
      VisibleColumnKeysJson: JSON.stringify(s.columnVisibility),
    });
    setListDetail(updated);
    setToast('Saved filters and columns');
  }

  async function handleDeleteList() {
    if (!selectedId || !confirm('Delete this list?')) return;
    await deleteUserList(selectedId);
    setLists((p) => p.filter((l) => l.ListID !== selectedId));
    setSelectedId(null);
    setToast('List deleted');
  }

  const sidebarItems = useMemo(
    () => lists.map((l) => ({ id: l.ListID, name: l.Name, subtitle: l.EntityType === 'C' ? 'Contacts' : 'Organizations' })),
    [lists],
  );

  const listPreset = listDetail ? parseListPreset(listDetail) : null;

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
        title="Lists"
        items={sidebarItems}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setShowCreateList(true)}
        createLabel="New list"
        emptyHint="Create a list to track contacts or organizations."
      />
      <div className="min-w-0 flex-1 space-y-4 px-4 py-2">
        <PageHeader title="Lists" />

        {!selectedId || !listDetail ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Select a list or create one to manage members and process columns.
          </div>
        ) : loadingList ? (
          <div className="py-20 text-center text-sm text-gray-500">Loading list…</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{listDetail.Name}</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {listDetail.EntityType === 'C' ? 'Contacts' : 'Organizations'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddColumn(true)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Add process column
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Add {listDetail.EntityType === 'C' ? 'contact' : 'organization'}
              </button>
              <button
                type="button"
                onClick={saveViewToList}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
                Save filters &amp; columns
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete list
              </button>
            </div>

            {listDetail.EntityType === 'C' ? (
              <EnhancedDataGrid<ListContactRow>
                data={contactRows}
                columns={contactGridColumns}
                entityName={`Contacts:list:${listDetail.ListID}`}
                emptyMessage="No contacts in this list. Add members above."
                rollupDimensions={rollupDimensions as RollupDimension[]}
                rollupAggregates={[]}
                showImport={false}
                listPreset={listPreset}
                presetKey={listDetail.ListID}
                gridSnapshotRef={gridSnapshotRef}
              />
            ) : (
              <EnhancedDataGrid<ListOrgRow>
                data={orgRows}
                columns={orgGridColumns}
                entityName={`Organizations:list:${listDetail.ListID}`}
                emptyMessage="No organizations in this list."
                rollupDimensions={rollupDimensions as RollupDimension[]}
                rollupAggregates={[]}
                showImport={false}
                listPreset={listPreset}
                presetKey={listDetail.ListID}
                gridSnapshotRef={gridSnapshotRef}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreateList} onClose={() => setShowCreateList(false)} title="New list">
        <div className="space-y-4">
          <FormField label="Name" required>
            {(id) => (
              <input id={id} className={inputClass} value={newListName} onChange={(e) => setNewListName(e.target.value)} />
            )}
          </FormField>
          <FormField label="Entity type">
            {(id) => (
              <select
                id={id}
                className={selectClass}
                value={newListEntity}
                onChange={(e) => setNewListEntity(e.target.value as 'C' | 'O')}
              >
                <option value="C">Contacts</option>
                <option value="O">Organizations</option>
              </select>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowCreateList(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleCreateList}>
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddColumn} onClose={() => setShowAddColumn(false)} title="Process column">
        <div className="space-y-4">
          <FormField label="Label" required>
            {(id) => <input id={id} className={inputClass} value={colLabel} onChange={(e) => setColLabel(e.target.value)} />}
          </FormField>
          <FormField label="Process tier (1–5)">
            {(id) => (
              <select id={id} className={selectClass} value={colTier} onChange={(e) => setColTier(e.target.value)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowAddColumn(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleAddColumn}>
              Add
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title={`Add ${listDetail?.EntityType === 'O' ? 'organization' : 'contact'}`}>
        <div className="space-y-4">
          <FormField label={listDetail?.EntityType === 'O' ? 'Organization' : 'Contact'}>
            {(id) => (
              <select id={id} className={selectClass} value={memberPick} onChange={(e) => setMemberPick(e.target.value)}>
                <option value="">Select…</option>
                {listDetail?.EntityType === 'C'
                  ? contacts
                      .filter((c) => !memberships.some((m) => m.contactId === c.ContactID))
                      .map((c) => (
                        <option key={c.ContactID} value={c.ContactID}>
                          {c.FirstName} {c.LastName}
                          {c.Email ? ` — ${c.Email}` : ''}
                        </option>
                      ))
                  : orgs
                      .filter((o) => !memberships.some((m) => m.organizationId === o.OrganizationID))
                      .map((o) => (
                        <option key={o.OrganizationID} value={o.OrganizationID}>
                          {o.OrganizationName}
                        </option>
                      ))}
              </select>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setShowAddMember(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={handleAddMember}>
              Add
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
