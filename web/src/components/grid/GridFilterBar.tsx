'use client';

import { useState } from 'react';
import type { GridColumn, ActiveFilter, FilterOperator } from './types';

type GridFilterBarProps<T> = {
  columns: GridColumn<T>[];
  activeFilters: ActiveFilter[];
  onAddFilter: (f: ActiveFilter) => void;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
};

const OPERATORS_BY_TYPE: Record<string, { value: FilterOperator; label: string }[]> = {
  string: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
  ],
  date: [
    { value: 'dateRange', label: 'Date range' },
    { value: 'equals', label: 'Equals' },
  ],
  lookup: [
    { value: 'in', label: 'Is' },
  ],
  boolean: [
    { value: 'equals', label: 'Is' },
  ],
};

function GridFilterBar<T>({ columns, activeFilters, onAddFilter, onRemoveFilter, onClearAll }: GridFilterBarProps<T>) {
  const filterableCols = columns.filter(c => c.filterable !== false);
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedOp, setSelectedOp] = useState<FilterOperator>('contains');
  const [filterValue, setFilterValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const selectedCol = filterableCols.find(c => c.key === selectedKey);
  const colType = selectedCol?.type ?? 'string';
  const operators = OPERATORS_BY_TYPE[colType] ?? OPERATORS_BY_TYPE.string;

  function handleAdd() {
    if (!selectedKey) return;
    let value: string | string[] | [string, string];
    if (selectedOp === 'dateRange') {
      value = [dateFrom, dateTo];
    } else {
      value = filterValue;
    }
    if (selectedOp === 'dateRange' ? (!dateFrom && !dateTo) : !filterValue) return;
    onAddFilter({ key: selectedKey, operator: selectedOp, value });
    setFilterValue('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[130px] flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Column</label>
          <select
            value={selectedKey}
            onChange={e => {
              setSelectedKey(e.target.value);
              const c = filterableCols.find(c2 => c2.key === e.target.value);
              const t = c?.type ?? 'string';
              setSelectedOp((OPERATORS_BY_TYPE[t] ?? OPERATORS_BY_TYPE.string)[0].value);
              setFilterValue('');
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select…</option>
            {filterableCols.map(c => (
              <option key={c.key} value={c.key}>{c.header}</option>
            ))}
          </select>
        </div>

        {selectedKey && (
          <div className="flex min-w-[120px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Condition</label>
            <select
              value={selectedOp}
              onChange={e => setSelectedOp(e.target.value as FilterOperator)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedKey && selectedOp === 'dateRange' ? (
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        ) : selectedKey && selectedCol?.filterOptions ? (
          <div className="flex min-w-[140px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Value</label>
            <select
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select…</option>
              {selectedCol.filterOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ) : selectedKey ? (
          <div className="flex min-w-[160px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Value</label>
            <input
              type={colType === 'number' ? 'number' : 'text'}
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Type value…"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        ) : null}

        {selectedKey && (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Apply
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(f => {
            const col = columns.find(c => c.key === f.key);
            const displayVal = f.operator === 'dateRange' && Array.isArray(f.value)
              ? `${f.value[0] || '…'} → ${f.value[1] || '…'}`
              : Array.isArray(f.value) ? f.value.join(', ') : String(f.value);
            return (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
              >
                {col?.header ?? f.key} {f.operator === 'in' ? 'is' : f.operator} &ldquo;{displayVal}&rdquo;
                <button
                  type="button"
                  onClick={() => onRemoveFilter(f.key)}
                  className="ml-0.5 text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default GridFilterBar;
