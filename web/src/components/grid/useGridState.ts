'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { GridColumn, ActiveFilter, SortDir } from './types';

const STORAGE_PREFIX = 'ie-grid-cols-';

function loadVisibility(entityName: string, columns: GridColumn<unknown>[]): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return Object.fromEntries(columns.map(c => [c.key, c.defaultVisible !== false]));
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + entityName);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return Object.fromEntries(columns.map(c => [c.key, c.defaultVisible !== false]));
}

function saveVisibility(entityName: string, vis: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_PREFIX + entityName, JSON.stringify(vis)); } catch { /* ignore */ }
}

function getCellRaw<T>(item: T, col: GridColumn<T>): string | number | null {
  if (col.getValue) return col.getValue(item);
  const raw = (item as Record<string, unknown>)[col.key];
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  return String(raw);
}

function getCellString<T>(item: T, col: GridColumn<T>): string {
  if (col.render) {
    const node = col.render(item);
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
  }
  const raw = getCellRaw(item, col);
  if (raw == null) return '';
  return String(raw);
}

function matchesFilter<T>(item: T, filter: ActiveFilter, col: GridColumn<T>): boolean {
  const raw = getCellRaw(item, col);
  const str = getCellString(item, col).toLowerCase();
  const val = typeof filter.value === 'string' ? filter.value.toLowerCase() : '';

  switch (filter.operator) {
    case 'contains':
      return str.includes(val);
    case 'equals':
      return str === val;
    case 'startsWith':
      return str.startsWith(val);
    case 'endsWith':
      return str.endsWith(val);
    case 'greaterThan':
      return raw != null && Number(raw) > Number(filter.value);
    case 'lessThan':
      return raw != null && Number(raw) < Number(filter.value);
    case 'in': {
      const arr = Array.isArray(filter.value) ? filter.value : [filter.value];
      return arr.some(v => str === v.toLowerCase());
    }
    case 'dateRange': {
      if (!Array.isArray(filter.value) || filter.value.length !== 2) return true;
      const [from, to] = filter.value;
      const dateStr = String(raw ?? '').slice(0, 10);
      if (!dateStr) return false;
      if (from && dateStr < from) return false;
      if (to && dateStr > to) return false;
      return true;
    }
    default:
      return true;
  }
}

export type GridPreset = {
  filters: ActiveFilter[];
  search: string;
  columnVisibility?: Record<string, boolean> | null;
};

export function useGridState<T>(
  data: T[],
  columns: GridColumn<T>[],
  entityName: string,
  options?: { preset?: GridPreset | null; presetKey?: string | number | null },
) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => loadVisibility(entityName, columns as GridColumn<unknown>[]),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  useEffect(() => {
    const p = options?.preset;
    const key = options?.presetKey;
    if (p == null || key == null) return;
    setActiveFilters(p.filters);
    setSearchQuery(p.search);
    if (p.columnVisibility && Object.keys(p.columnVisibility).length > 0) {
      setColumnVisibility((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(p.columnVisibility!)) {
          next[k] = v;
        }
        return next;
      });
    }
  }, [options?.presetKey]);

  useEffect(() => {
    saveVisibility(entityName, columnVisibility);
  }, [entityName, columnVisibility]);

  const toggleColumn = useCallback((key: string) => {
    setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setAllColumns = useCallback((visible: boolean) => {
    setColumnVisibility(Object.fromEntries(columns.map(c => [c.key, visible])));
  }, [columns]);

  const visibleColumns = useMemo(
    () => columns.filter(c => columnVisibility[c.key] !== false),
    [columns, columnVisibility],
  );

  const addFilter = useCallback((f: ActiveFilter) => {
    setActiveFilters(prev => [...prev.filter(x => x.key !== f.key), f]);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setActiveFilters(prev => prev.filter(x => x.key !== key));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
  }, []);

  const toggleSort = useCallback((key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); }
    else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
    else { setSortDir('asc'); }
  }, [columns, sortKey, sortDir]);

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data;
    const searchCols = columns.filter(c => c.searchable !== false);
    return data.filter(row =>
      searchCols.some(col => getCellString(row, col).toLowerCase().includes(q)),
    );
  }, [data, columns, searchQuery]);

  const filtered = useMemo(() => {
    if (activeFilters.length === 0) return searched;
    return searched.filter(row =>
      activeFilters.every(f => {
        const col = columns.find(c => c.key === f.key);
        if (!col) return true;
        return matchesFilter(row, f, col);
      }),
    );
  }, [searched, activeFilters, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortable) return filtered;
    const copy = [...filtered];
    const isDate = col.type === 'date';
    copy.sort((a, b) => {
      const va = getCellRaw(a, col);
      const vb = getCellRaw(b, col);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (isDate) {
        const da = new Date(String(va)).getTime();
        const db = new Date(String(vb)).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      }
      const na = Number(va);
      const nb = Number(vb);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const setFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  return {
    processedData: sorted,
    filteredData: filtered,
    totalCount: data.length,
    filteredCount: filtered.length,
    columnVisibility,
    setColumnVisibility: setColumnVisibility,
    toggleColumn,
    setAllColumns,
    visibleColumns,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters: setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    sortKey,
    sortDir,
    toggleSort,
  };
}
