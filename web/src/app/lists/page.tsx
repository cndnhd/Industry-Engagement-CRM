'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Contact, Organization, UserList, UserListColumn, ListMembershipRow, LookupItem } from '@/types';
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
  previewSegment,
  executeSegment,
} from '@/lib/api';
import {
  RuleGroupEditor,
  emptyGroup,
  ORG_FIELDS,
  CONTACT_FIELDS,
  type RuleGroup,
} from '@/components/segments/SegmentRuleBuilder';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
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

function AddMembersPanel({
  entityType,
  contacts,
  orgs,
  orgMap,
  existingContactIds,
  existingOrgIds,
  search,
  onSearchChange,
  orgFilter,
  onOrgFilterChange,
  selected,
  onSelectedChange,
  saving,
  onAdd,
  onCancel,
}: {
  entityType: 'C' | 'O';
  contacts: Contact[];
  orgs: Organization[];
  orgMap: Map<number, string>;
  existingContactIds: Set<number>;
  existingOrgIds: Set<number>;
  search: string;
  onSearchChange: (v: string) => void;
  orgFilter: string;
  onOrgFilterChange: (v: string) => void;
  selected: Set<number>;
  onSelectedChange: (s: Set<number>) => void;
  saving: boolean;
  onAdd: () => void;
  onCancel: () => void;
}) {
  const sortedOrgs = useMemo(() => [...orgs].sort((a, b) => a.OrganizationName.localeCompare(b.OrganizationName)), [orgs]);

  const availableContacts = useMemo(() => {
    return contacts.filter((c) => !existingContactIds.has(c.ContactID));
  }, [contacts, existingContactIds]);

  const availableOrgs = useMemo(() => {
    return orgs.filter((o) => !existingOrgIds.has(o.OrganizationID));
  }, [orgs, existingOrgIds]);

  const filteredContacts = useMemo(() => {
    let list = availableContacts;
    if (orgFilter) {
      const oid = Number(orgFilter);
      list = list.filter((c) => c.OrganizationID === oid);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          `${c.FirstName} ${c.LastName}`.toLowerCase().includes(q) ||
          (c.Email ?? '').toLowerCase().includes(q) ||
          (c.Title ?? '').toLowerCase().includes(q) ||
          (orgMap.get(c.OrganizationID!) ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [availableContacts, orgFilter, search, orgMap]);

  const filteredOrgs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableOrgs;
    return availableOrgs.filter(
      (o) =>
        o.OrganizationName.toLowerCase().includes(q) ||
        (o.City ?? '').toLowerCase().includes(q) ||
        (o.State ?? '').toLowerCase().includes(q),
    );
  }, [availableOrgs, search]);

  const items = entityType === 'C' ? filteredContacts : filteredOrgs;
  const allVisibleIds = entityType === 'C'
    ? filteredContacts.map((c) => c.ContactID)
    : filteredOrgs.map((o) => o.OrganizationID);

  function toggleOne(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  }

  function toggleAll() {
    if (allVisibleIds.every((id) => selected.has(id))) {
      const next = new Set(selected);
      for (const id of allVisibleIds) next.delete(id);
      onSelectedChange(next);
    } else {
      onSelectedChange(new Set([...selected, ...allVisibleIds]));
    }
  }

  function addAllFromOrg(orgId: number) {
    const ids = contacts.filter((c) => c.OrganizationID === orgId && !existingContactIds.has(c.ContactID)).map((c) => c.ContactID);
    onSelectedChange(new Set([...selected, ...ids]));
  }

  const allChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by name, email, org…"
          className={`${inputClass} min-w-0 flex-1`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {entityType === 'C' && (
          <select
            className={selectClass}
            value={orgFilter}
            onChange={(e) => onOrgFilterChange(e.target.value)}
            aria-label="Filter by organization"
          >
            <option value="">All organizations</option>
            {sortedOrgs.map((o) => (
              <option key={o.OrganizationID} value={o.OrganizationID}>
                {o.OrganizationName}
              </option>
            ))}
          </select>
        )}
      </div>

      {entityType === 'C' && orgFilter && (
        <button
          type="button"
          onClick={() => addAllFromOrg(Number(orgFilter))}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Select all from {orgMap.get(Number(orgFilter)) ?? 'this org'} ({contacts.filter((c) => c.OrganizationID === Number(orgFilter) && !existingContactIds.has(c.ContactID)).length})
        </button>
      )}

      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </th>
              {entityType === 'C' ? (
                <>
                  <th className="px-3 py-2 font-semibold text-gray-700">Name</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Organization</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Title</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Email</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 font-semibold text-gray-700">Organization</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Location</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={entityType === 'C' ? 5 : 3} className="px-3 py-6 text-center text-gray-500">
                  {search || orgFilter ? 'No matches.' : 'All already added.'}
                </td>
              </tr>
            ) : entityType === 'C' ? (
              (filteredContacts as Contact[]).map((c) => (
                <tr
                  key={c.ContactID}
                  className={`cursor-pointer border-b border-gray-100 transition-colors ${selected.has(c.ContactID) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleOne(c.ContactID)}
                >
                  <td className="px-3 py-1.5">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600" checked={selected.has(c.ContactID)} readOnly />
                  </td>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{c.FirstName} {c.LastName}</td>
                  <td className="px-3 py-1.5 text-gray-600">{orgMap.get(c.OrganizationID!) ?? '—'}</td>
                  <td className="px-3 py-1.5 text-gray-600">{c.Title ?? '—'}</td>
                  <td className="px-3 py-1.5 text-gray-600">{c.Email ?? '—'}</td>
                </tr>
              ))
            ) : (
              (filteredOrgs as Organization[]).map((o) => (
                <tr
                  key={o.OrganizationID}
                  className={`cursor-pointer border-b border-gray-100 transition-colors ${selected.has(o.OrganizationID) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleOne(o.OrganizationID)}
                >
                  <td className="px-3 py-1.5">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600" checked={selected.has(o.OrganizationID)} readOnly />
                  </td>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{o.OrganizationName}</td>
                  <td className="px-3 py-1.5 text-gray-600">{[o.City, o.State].filter(Boolean).join(', ') || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{selected.size} selected</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            disabled={selected.size === 0 || saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={onAdd}
          >
            {saving ? 'Adding…' : `Add ${selected.size}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listDetail, setListDetail] = useState<UserList | null>(null);
  const [listColumns, setListColumns] = useState<UserListColumn[]>([]);
  const [memberships, setMemberships] = useState<ListMembershipRow[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgLookups, setOrgLookups] = useState<Record<string, LookupItem[]>>({});
  const [functionalAreas, setFunctionalAreas] = useState<LookupItem[]>([]);
  const [influenceLevels, setInfluenceLevels] = useState<LookupItem[]>([]);
  const [riskTolerances, setRiskTolerances] = useState<LookupItem[]>([]);
  const [personalOrientations, setPersonalOrientations] = useState<LookupItem[]>([]);

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
  const [memberSearch, setMemberSearch] = useState('');
  const [memberOrgFilter, setMemberOrgFilter] = useState('');
  const [memberSelected, setMemberSelected] = useState<Set<number>>(new Set());
  const [addingSaving, setAddingSaving] = useState(false);

  const [showSmartFilter, setShowSmartFilter] = useState(false);
  const [smartFilterGroup, setSmartFilterGroup] = useState<RuleGroup>(emptyGroup());
  const [smartPreviewCount, setSmartPreviewCount] = useState<number | null>(null);
  const [smartPreviewLoading, setSmartPreviewLoading] = useState(false);
  const [smartResults, setSmartResults] = useState<Record<string, unknown>[] | null>(null);
  const [smartResultsLoading, setSmartResultsLoading] = useState(false);
  const [smartAdding, setSmartAdding] = useState(false);

  const gridSnapshotRef = useRef<GridSnapshot | null>(null);

  const reloadLists = useCallback(async () => {
    const rows = await fetchUserLists();
    setLists(rows);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, o, orgTypes, pri, rel, fa, il, rt, po] = await Promise.all([
          fetchContacts(),
          fetchOrganizations(),
          loadLookup('orgTypes'),
          loadLookup('priorityLevels'),
          loadLookup('relationshipLevels'),
          loadLookup('functionalAreas'),
          loadLookup('influenceLevels'),
          loadLookup('riskToleranceLevels'),
          loadLookup('personalOrientations'),
        ]);
        setContacts(c);
        setOrgs(o);
        setOrgLookups({ orgTypes, priorityLevels: pri, relationshipLevels: rel });
        setFunctionalAreas(fa);
        setInfluenceLevels(il);
        setRiskTolerances(rt);
        setPersonalOrientations(po);
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
        filterable: true,
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
        filterable: true,
        getValue: (c) => c.Title ?? '',
      },
      {
        key: 'Email',
        header: 'Email',
        type: 'string',
        searchable: true,
        filterable: true,
        getValue: (c) => c.Email ?? '',
      },
      {
        key: 'Phone',
        header: 'Phone',
        type: 'string',
        defaultVisible: false,
        filterable: true,
        getValue: (c) => c.Phone ?? '',
      },
      {
        key: 'FunctionalArea',
        header: 'Functional Area',
        type: 'lookup',
        filterable: true,
        defaultVisible: false,
        filterOptions: functionalAreas.map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (c) => resolveName(functionalAreas, c.FunctionalAreaID),
        getValue: (c) => resolveName(functionalAreas, c.FunctionalAreaID),
      },
      {
        key: 'InfluenceLevel',
        header: 'Influence Level',
        type: 'lookup',
        filterable: true,
        defaultVisible: false,
        filterOptions: influenceLevels.map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (c) => {
          const name = resolveName(influenceLevels, c.InfluenceLevelID);
          if (name === '—') return '—';
          const color = name.toLowerCase().includes('high') ? 'emerald' as const : name.toLowerCase().includes('medium') ? 'amber' as const : 'slate' as const;
          return <Badge label={name} color={color} />;
        },
        getValue: (c) => resolveName(influenceLevels, c.InfluenceLevelID),
      },
      {
        key: 'RiskTolerance',
        header: 'Risk Tolerance',
        type: 'lookup',
        filterable: true,
        defaultVisible: false,
        filterOptions: riskTolerances.map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (c) => resolveName(riskTolerances, c.RiskToleranceID),
        getValue: (c) => resolveName(riskTolerances, c.RiskToleranceID),
      },
      {
        key: 'PersonalOrientation',
        header: 'Personal Orientation',
        type: 'lookup',
        filterable: true,
        defaultVisible: false,
        filterOptions: personalOrientations.map((i) => ({ value: i.name.toLowerCase(), label: i.name })),
        render: (c) => resolveName(personalOrientations, c.PersonalOrientationID),
        getValue: (c) => resolveName(personalOrientations, c.PersonalOrientationID),
      },
      {
        key: 'IsPrimary',
        header: 'Primary',
        type: 'boolean',
        filterable: true,
        defaultVisible: false,
        filterOptions: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
        render: (c) => c.IsPrimaryContact ? <Badge label="Primary" color="indigo" /> : '—',
        getValue: (c) => c.IsPrimaryContact ? 'Yes' : 'No',
      },
      {
        key: 'Alumni',
        header: 'Alumni',
        type: 'boolean',
        filterable: true,
        defaultVisible: false,
        filterOptions: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
        render: (c) => c.Alumni ? <Badge label="Alumni" color="blue" /> : '—',
        getValue: (c) => c.Alumni ? 'Yes' : 'No',
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
      filterable: true,
      defaultVisible: true,
      filterOptions: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Level ${n}` })),
      render: (row) => (
        <LevelPicker
          value={row._cells[lc.ColumnID] ?? 1}
          onChange={(n) => handleCell(row._membershipId, lc.ColumnID, n)}
        />
      ),
      getValue: (row) => row._cells[lc.ColumnID] ?? 1,
    }));

    return [...base.slice(0, -1), ...dyn, base[base.length - 1]];
  }, [contactRows, orgMap, listColumns, handleCell, selectedId, functionalAreas, influenceLevels, riskTolerances, personalOrientations]);

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

  async function handleAddMembers() {
    if (!selectedId || !listDetail || memberSelected.size === 0) return;
    setAddingSaving(true);
    try {
      const ids = [...memberSelected];
      for (const id of ids) {
        try {
          if (listDetail.EntityType === 'C') {
            await addListMembership(selectedId, { ContactID: id });
          } else {
            await addListMembership(selectedId, { OrganizationID: id });
          }
        } catch {
          /* skip duplicates / errors */
        }
      }
      const mem = await fetchListMemberships(selectedId);
      setMemberships(mem);
      setShowAddMember(false);
      setMemberSelected(new Set());
      setMemberSearch('');
      setMemberOrgFilter('');
      setToast(`Added ${ids.length} to list`);
    } finally {
      setAddingSaving(false);
    }
  }

  function resetSmartFilter() {
    setSmartFilterGroup(emptyGroup());
    setSmartPreviewCount(null);
    setSmartResults(null);
  }

  async function handleSmartPreview() {
    if (!listDetail) return;
    const entityType = listDetail.EntityType;
    setSmartPreviewLoading(true);
    setSmartPreviewCount(null);
    setSmartResults(null);
    try {
      const resp = await previewSegment({ rules: { entityType, root: smartFilterGroup } });
      setSmartPreviewCount(resp.count);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Preview failed');
    }
    setSmartPreviewLoading(false);
  }

  async function handleSmartExecute() {
    if (!listDetail) return;
    const entityType = listDetail.EntityType;
    setSmartResultsLoading(true);
    try {
      const rows = await executeSegment({ rules: { entityType, root: smartFilterGroup } });
      setSmartResults(rows);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Execute failed');
    }
    setSmartResultsLoading(false);
  }

  async function handleSmartAddAll() {
    if (!selectedId || !listDetail || !smartResults || smartResults.length === 0) return;
    setSmartAdding(true);
    const existingContactIds = new Set(memberships.filter(m => m.contactId != null).map(m => m.contactId!));
    const existingOrgIds = new Set(memberships.filter(m => m.organizationId != null).map(m => m.organizationId!));
    let added = 0;
    try {
      for (const row of smartResults) {
        try {
          if (listDetail.EntityType === 'C') {
            const id = row.ContactID as number;
            if (id && !existingContactIds.has(id)) {
              await addListMembership(selectedId, { ContactID: id });
              added++;
            }
          } else {
            const id = row.OrganizationID as number;
            if (id && !existingOrgIds.has(id)) {
              await addListMembership(selectedId, { OrganizationID: id });
              added++;
            }
          }
        } catch { /* skip duplicates */ }
      }
      const mem = await fetchListMemberships(selectedId);
      setMemberships(mem);
      setToast(`Added ${added} from smart filter`);
      setShowSmartFilter(false);
      resetSmartFilter();
    } finally {
      setSmartAdding(false);
    }
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
                onClick={() => { setShowSmartFilter(!showSmartFilter); if (showSmartFilter) resetSmartFilter(); }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm ${showSmartFilter ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                  Smart Filter
                </span>
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

            {showSmartFilter && (
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Smart Filter — Boolean Rule Builder</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Build rules to find {listDetail.EntityType === 'C' ? 'contacts' : 'organizations'}, preview matches, then add them all to this list.
                    </p>
                  </div>
                  <button type="button" onClick={() => { setShowSmartFilter(false); resetSmartFilter(); }}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <RuleGroupEditor
                    group={smartFilterGroup}
                    fields={listDetail.EntityType === 'O' ? ORG_FIELDS : CONTACT_FIELDS}
                    onChange={setSmartFilterGroup}
                    depth={0}
                  />
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={handleSmartPreview} disabled={smartPreviewLoading || smartFilterGroup.conditions.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      {smartPreviewLoading ? 'Counting…' : 'Preview Count'}
                    </button>
                    <button type="button" onClick={handleSmartExecute} disabled={smartResultsLoading || smartFilterGroup.conditions.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                      </svg>
                      {smartResultsLoading ? 'Running…' : 'View Results'}
                    </button>
                    {smartPreviewCount !== null && (
                      <span className="text-sm font-semibold text-indigo-600">{smartPreviewCount} match{smartPreviewCount !== 1 ? 'es' : ''}</span>
                    )}
                    <div className="flex-1" />
                    {smartResults && smartResults.length > 0 && (
                      <button type="button" onClick={handleSmartAddAll} disabled={smartAdding}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {smartAdding ? 'Adding…' : `Add all ${smartResults.length} to list`}
                      </button>
                    )}
                  </div>
                  {smartResults && smartResults.length > 0 && (
                    <div className="max-h-48 overflow-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr className="border-b border-gray-200">
                            {Object.keys(smartResults[0]).slice(0, 6).map((k) => (
                              <th key={k} className="px-3 py-1.5 font-semibold text-gray-600">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {smartResults.slice(0, 50).map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              {Object.keys(smartResults[0]).slice(0, 6).map((k) => (
                                <td key={k} className="px-3 py-1.5 text-gray-700 truncate max-w-[200px]">{String(row[k] ?? '—')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {smartResults && smartResults.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-3">No matches found.</p>
                  )}
                </div>
              </div>
            )}

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

      <Modal isOpen={showAddMember} onClose={() => { setShowAddMember(false); setMemberSelected(new Set()); setMemberSearch(''); setMemberOrgFilter(''); }} title={`Add ${listDetail?.EntityType === 'O' ? 'organizations' : 'contacts'}`} size="xl">
        <AddMembersPanel
          entityType={listDetail?.EntityType ?? 'C'}
          contacts={contacts}
          orgs={orgs}
          orgMap={orgMap}
          existingContactIds={new Set(memberships.filter(m => m.contactId != null).map(m => m.contactId!))}
          existingOrgIds={new Set(memberships.filter(m => m.organizationId != null).map(m => m.organizationId!))}
          search={memberSearch}
          onSearchChange={setMemberSearch}
          orgFilter={memberOrgFilter}
          onOrgFilterChange={setMemberOrgFilter}
          selected={memberSelected}
          onSelectedChange={setMemberSelected}
          saving={addingSaving}
          onAdd={handleAddMembers}
          onCancel={() => { setShowAddMember(false); setMemberSelected(new Set()); setMemberSearch(''); setMemberOrgFilter(''); }}
        />
      </Modal>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
