'use client';

import { useMemo, useState } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
};

type SortDir = 'asc' | 'desc' | null;

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

function getCellValue<T>(item: T, col: Column<T>): string {
  if (col.render) {
    const node = col.render(item);
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    return '';
  }
  const raw = (item as Record<string, unknown>)[col.key];
  if (raw == null) return '';
  return String(raw);
}

function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data to display.',
  searchable = false,
  searchPlaceholder = 'Search…',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => getCellValue(row, col).toLowerCase().includes(q)),
    );
  }, [data, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = getCellValue(a, col);
      const vb = getCellValue(b, col);
      const na = Number(va);
      const nb = Number(vb);
      if (!Number.isNaN(na) && !Number.isNaN(nb) && va !== '' && vb !== '') {
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
      return;
    }
    if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir('asc');
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5">
      {searchable ? (
        <div className="border-b border-gray-100 px-4 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-gray-700 ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100/80' : ''
                  }`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable ? (
                      <span className="tabular-nums text-gray-400" aria-hidden>
                        {sortKey === col.key && sortDir === 'asc'
                          ? '↑'
                          : sortKey === col.key && sortDir === 'desc'
                            ? '↓'
                            : '↕'}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-gray-100 transition-colors last:border-0 ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${onRowClick ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-gray-50/80'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-800">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
