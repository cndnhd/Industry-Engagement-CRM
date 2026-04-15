'use client';

import { useState, useRef, useEffect } from 'react';
import type { GridColumn } from './types';

type ColumnMenuProps<T> = {
  columns: GridColumn<T>[];
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};

function ColumnMenu<T>({ columns, visibility, onToggle, onShowAll, onHideAll }: ColumnMenuProps<T>) {
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

  const visibleCount = columns.filter(c => visibility[c.key] !== false).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
        Columns
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
          {visibleCount}/{columns.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Toggle columns</span>
            <div className="flex gap-2">
              <button type="button" onClick={onShowAll} className="text-xs text-blue-600 hover:underline">All</button>
              <button type="button" onClick={onHideAll} className="text-xs text-blue-600 hover:underline">None</button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto px-1 py-1">
            {columns.map(col => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={visibility[col.key] !== false}
                  onChange={() => onToggle(col.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                />
                {col.header}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColumnMenu;
