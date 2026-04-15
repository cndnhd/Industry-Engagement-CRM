'use client';

import { useState, useRef, useEffect } from 'react';
import type { GridColumn } from './types';

type ExportButtonProps<T> = {
  data: T[];
  columns: GridColumn<T>[];
  allColumns: GridColumn<T>[];
  entityName: string;
};

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getCellExport<T>(item: T, col: GridColumn<T>): string {
  if (col.getValue) {
    const v = col.getValue(item);
    return v == null ? '' : String(v);
  }
  if (col.render) {
    const node = col.render(item);
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
  }
  const raw = (item as Record<string, unknown>)[col.key];
  return raw == null ? '' : String(raw);
}

function ExportButton<T>({ data, columns, allColumns, entityName }: ExportButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function doExport(cols: GridColumn<T>[]) {
    const BOM = '\uFEFF';
    const headerRow = cols.map(c => escapeCSV(c.header)).join(',');
    const rows = data.map(item =>
      cols.map(col => escapeCSV(getCellExport(item, col))).join(','),
    );
    const csv = BOM + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${entityName}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => doExport(columns)}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Visible columns ({columns.length})
          </button>
          {allColumns.length !== columns.length && (
            <button
              type="button"
              onClick={() => doExport(allColumns)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              All columns ({allColumns.length})
            </button>
          )}
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            {data.length} rows after filters
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
