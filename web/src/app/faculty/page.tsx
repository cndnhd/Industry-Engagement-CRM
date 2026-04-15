'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Faculty, LookupItem } from '@/types';
import {
  fetchFaculty, createFaculty, updateFaculty, deleteFaculty,
  fetchFacultyLinkages, loadLookup, resolveName,
} from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';
import { EnhancedDataGrid, type GridColumn, type RollupDimension, type ImportConfig } from '@/components/grid';

type Linkage = { OrgName?: string; Role?: string; StartDate?: string };

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [facultyTitles, setFacultyTitles] = useState<LookupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [linkages, setLinkages] = useState<Linkage[]>([]);
  const [linkagesLoading, setLinkagesLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'destructive' } | null>(null);

  const reload = useCallback(async () => {
    try {
      const [f, d, t] = await Promise.all([
        fetchFaculty(), loadLookup('departments'), loadLookup('facultyTitles'),
      ]);
      setFaculty(f); setDepartments(d); setFacultyTitles(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load faculty');
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

  useEffect(() => {
    if (!selected) return;
    setLinkagesLoading(true);
    fetchFacultyLinkages(selected.FacultyID)
      .then(rows => setLinkages(rows as Linkage[]))
      .catch(() => setLinkages([]))
      .finally(() => setLinkagesLoading(false));
  }, [selected]);

  const columns: GridColumn<Faculty>[] = useMemo(() => [
    {
      key: 'FullName', header: 'Full Name', type: 'string' as const, sortable: true, searchable: true,
      render: f => <span className="font-medium text-gray-900">{f.FirstName} {f.LastName}</span>,
      getValue: f => `${f.FirstName} ${f.LastName}`,
    },
    {
      key: 'Department', header: 'Department', type: 'lookup' as const, sortable: true, filterable: true,
      filterOptions: departments.map(d => ({ value: d.name.toLowerCase(), label: d.name })),
      render: f => resolveName(departments, f.DepartmentID),
      getValue: f => resolveName(departments, f.DepartmentID),
    },
    {
      key: 'FacultyTitle', header: 'Title', type: 'lookup' as const, sortable: true, filterable: true,
      filterOptions: facultyTitles.map(t => ({ value: t.name.toLowerCase(), label: t.name })),
      render: f => resolveName(facultyTitles, f.FacultyTitleID),
      getValue: f => resolveName(facultyTitles, f.FacultyTitleID),
    },
    {
      key: 'Email', header: 'Email', type: 'string' as const, searchable: true,
      getValue: f => f.Email ?? '',
    },
    {
      key: 'Notes', header: 'Notes', type: 'string' as const, searchable: true, defaultVisible: false,
      render: f => { const t = f.Notes ?? ''; return t.length > 60 ? `${t.slice(0, 60)}…` : t || '—'; },
      getValue: f => f.Notes ?? '',
    },
  ], [departments, facultyTitles]);

  const rollupDimensions: RollupDimension[] = useMemo(() => [
    { key: 'dept', label: 'Department', getGroup: (item) => resolveName(departments, (item as Faculty).DepartmentID) },
    { key: 'title', label: 'Faculty Title', getGroup: (item) => resolveName(facultyTitles, (item as Faculty).FacultyTitleID) },
  ], [departments, facultyTitles]);

  const importConfig: ImportConfig = useMemo(() => ({
    expectedHeaders: [
      { csvHeader: 'FirstName', fieldKey: 'FirstName', required: true },
      { csvHeader: 'LastName', fieldKey: 'LastName', required: true },
      { csvHeader: 'Email', fieldKey: 'Email' },
      { csvHeader: 'Department', fieldKey: 'Department' },
      { csvHeader: 'FacultyTitle', fieldKey: 'FacultyTitle' },
      { csvHeader: 'Notes', fieldKey: 'Notes' },
    ],
    duplicateField: 'Email',
    duplicatePolicy: 'skip' as const,
    existingValues: new Set(faculty.map(f => (f.Email ?? '').toLowerCase()).filter(Boolean)),
  }), [faculty]);

  async function handleImport(rows: Record<string, string>[]) {
    const deptMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));
    const titleMap = new Map(facultyTitles.map(t => [t.name.toLowerCase(), t.id]));
    for (const row of rows) {
      const body: Record<string, unknown> = {
        FirstName: row.FirstName, LastName: row.LastName,
        Email: row.Email || undefined, Notes: row.Notes || undefined,
      };
      if (row.Department) body.DepartmentID = deptMap.get(row.Department.toLowerCase());
      if (row.FacultyTitle) body.FacultyTitleID = titleMap.get(row.FacultyTitle.toLowerCase());
      await createFaculty(body);
    }
    await reload();
    setToast({ message: `${rows.length} faculty imported`, type: 'success' });
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: form.FirstName, LastName: form.LastName,
        Email: form.Email || undefined, Title: form.Title || undefined,
        Notes: form.Notes || undefined,
        DepartmentID: form.DepartmentID ? Number(form.DepartmentID) : undefined,
        FacultyTitleID: form.FacultyTitleID ? Number(form.FacultyTitleID) : undefined,
      };
      const created = await createFaculty(body);
      setFaculty(prev => [...prev, created]);
      setShowCreate(false);
      setForm({});
      setToast({ message: 'Faculty created', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to create faculty', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function openEditForm(fac: Faculty) {
    setEditForm({
      FirstName: fac.FirstName ?? '', LastName: fac.LastName ?? '',
      Title: fac.Title ?? '', Email: fac.Email ?? '',
      DepartmentID: fac.DepartmentID != null ? String(fac.DepartmentID) : '',
      FacultyTitleID: fac.FacultyTitleID != null ? String(fac.FacultyTitleID) : '',
      Notes: fac.Notes ?? '',
    });
    setShowEdit(true);
  }

  async function handleEditSave() {
    if (!selected) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        FirstName: editForm.FirstName, LastName: editForm.LastName,
        Email: editForm.Email || undefined, Title: editForm.Title || undefined,
        Notes: editForm.Notes || undefined,
        DepartmentID: editForm.DepartmentID ? Number(editForm.DepartmentID) : undefined,
        FacultyTitleID: editForm.FacultyTitleID ? Number(editForm.FacultyTitleID) : undefined,
      };
      await updateFaculty(selected.FacultyID, body);
      await reload();
      setSelected(null);
      setShowEdit(false);
      setLinkages([]);
      setToast({ message: 'Faculty updated successfully', type: 'success' });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to update faculty', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this faculty member? This cannot be undone.')) return;
    try {
      await deleteFaculty(id);
      setFaculty(prev => prev.filter(f => f.FacultyID !== id));
      setSelected(null);
      setShowEdit(false);
      setLinkages([]);
      setToast({ message: 'Faculty deleted', type: 'destructive' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete', type: 'error' });
    }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error) return <div className="py-16 text-center"><p className="text-sm text-red-600">{error}</p></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Faculty" action={{ label: '+ New Faculty', onClick: () => setShowCreate(true) }} />

      <EnhancedDataGrid<Faculty>
        data={faculty}
        columns={columns}
        entityName="Faculty"
        onRowClick={item => setSelected(item)}
        emptyMessage="No faculty found. Adjust filters or add a new faculty member."
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
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setShowEdit(false); setLinkages([]); }} title={showEdit ? 'Edit Faculty' : 'Faculty Details'} size="xl">
        {selected && !showEdit && (
          <>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Detail label="Name" value={`${selected.FirstName} ${selected.LastName}`} />
              <Detail label="Department" value={resolveName(departments, selected.DepartmentID)} />
              <Detail label="Faculty Title" value={resolveName(facultyTitles, selected.FacultyTitleID)} />
              <Detail label="Email" value={selected.Email} />
              <Detail label="Title" value={selected.Title} />
              {selected.Notes && <div className="col-span-2"><Detail label="Notes" value={selected.Notes} /></div>}
            </dl>
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Organization Linkages</h3>
              {linkagesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /> Loading linkages…</div>
              ) : linkages.length === 0 ? (
                <p className="text-sm text-gray-500">No organization linkages recorded.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50/60"><tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Organization</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Start Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {linkages.map((l, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-gray-700">{l.OrgName ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-700">{l.Role ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-700">{l.StartDate ? new Date(l.StartDate).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={() => handleDelete(selected.FacultyID)} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
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
              <FormField label="Department">{id => (<select id={id} className={selectClass} value={editForm.DepartmentID ?? ''} onChange={e => setEditForm(f => ({ ...f, DepartmentID: e.target.value }))}><option value="">Select…</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>)}</FormField>
              <FormField label="Faculty Title">{id => (<select id={id} className={selectClass} value={editForm.FacultyTitleID ?? ''} onChange={e => setEditForm(f => ({ ...f, FacultyTitleID: e.target.value }))}><option value="">Select…</option>{facultyTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}</FormField>
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
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm({}); }} title="New Faculty" size="xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="First Name" required>{id => <input id={id} className={inputClass} value={form.FirstName ?? ''} onChange={e => setForm(f => ({ ...f, FirstName: e.target.value }))} />}</FormField>
          <FormField label="Last Name" required>{id => <input id={id} className={inputClass} value={form.LastName ?? ''} onChange={e => setForm(f => ({ ...f, LastName: e.target.value }))} />}</FormField>
          <FormField label="Department">{id => (<select id={id} className={selectClass} value={form.DepartmentID ?? ''} onChange={e => setForm(f => ({ ...f, DepartmentID: e.target.value }))}><option value="">Select…</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>)}</FormField>
          <FormField label="Faculty Title">{id => (<select id={id} className={selectClass} value={form.FacultyTitleID ?? ''} onChange={e => setForm(f => ({ ...f, FacultyTitleID: e.target.value }))}><option value="">Select…</option>{facultyTitles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}</FormField>
          <FormField label="Email">{id => <input id={id} type="email" className={inputClass} value={form.Email ?? ''} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))} />}</FormField>
          <FormField label="Title">{id => <input id={id} className={inputClass} value={form.Title ?? ''} onChange={e => setForm(f => ({ ...f, Title: e.target.value }))} />}</FormField>
          <div className="col-span-2"><FormField label="Notes">{id => <textarea id={id} rows={3} className={inputClass} value={form.Notes ?? ''} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} />}</FormField></div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setShowCreate(false); setForm({}); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !form.FirstName || !form.LastName} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : 'Create Faculty'}</button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-0.5 text-gray-900">{value || '—'}</dd></div>;
}
