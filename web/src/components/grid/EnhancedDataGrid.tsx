'use client';

import { useState, useEffect, type MutableRefObject } from 'react';
import type { GridColumn, RollupDimension, RollupAggregate } from './types';
import { useGridState, type GridPreset } from './useGridState';
import ColumnMenu from './ColumnMenu';
import GridSearch from './GridSearch';
import GridFilterBar from './GridFilterBar';
import ExportButton from './ExportButton';
import RollupPanel from './RollupPanel';
import ImportDialog, { type ImportConfig } from './ImportDialog';

export type GridSnapshot = {
  activeFilters: import('./types').ActiveFilter[];
  searchQuery: string;
  columnVisibility: Record<string, boolean>;
};

export type EnhancedDataGridProps<T> = {
  data: T[];
  columns: GridColumn<T>[];
  entityName: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  rollupDimensions?: RollupDimension[];
  rollupAggregates?: RollupAggregate[];
  importConfig?: ImportConfig;
  onImport?: (rows: Record<string, string>[]) => Promise<void>;
  showFilters?: boolean;
  showSearch?: boolean;
  showExport?: boolean;
  showImport?: boolean;
  showRollup?: boolean;
  showColumnToggle?: boolean;
  headerAction?: React.ReactNode;
  /** When set with presetKey, hydrates filters/search/column visibility (e.g. saved list view). */
  listPreset?: GridPreset | null;
  presetKey?: string | number | null;
  /** Updated on each render with current filter/column state for “save view” actions. */
  gridSnapshotRef?: MutableRefObject<GridSnapshot | null>;
};

function EnhancedDataGrid<T>({
  data,
  columns,
  entityName,
  onRowClick,
  emptyMessage = 'No data to display.',
  rollupDimensions = [],
  rollupAggregates = [],
  importConfig,
  onImport,
  showFilters = true,
  showSearch = true,
  showExport = true,
  showImport = false,
  showRollup = true,
  showColumnToggle = true,
  headerAction,
  listPreset = null,
  presetKey = null,
  gridSnapshotRef,
}: EnhancedDataGridProps<T>) {
  const grid = useGridState(data, columns, entityName, { preset: listPreset, presetKey });
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    if (!gridSnapshotRef) return;
    gridSnapshotRef.current = {
      activeFilters: grid.activeFilters,
      searchQuery: grid.searchQuery,
      columnVisibility: grid.columnVisibility,
    };
  });

  return (
    <div className="space-y-4">
      {/* Toolbar: search + column menu + export + import */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-950/5">
        {showSearch && (
          <GridSearch
            value={grid.searchQuery}
            onChange={grid.setSearchQuery}
            placeholder={`Search ${entityName.toLowerCase()}…`}
            resultCount={grid.filteredCount}
            totalCount={grid.totalCount}
          />
        )}
        <div className="flex items-center gap-2">
          {showColumnToggle && (
            <ColumnMenu
              columns={columns}
              visibility={grid.columnVisibility}
              onToggle={grid.toggleColumn}
              onShowAll={() => grid.setAllColumns(true)}
              onHideAll={() => grid.setAllColumns(false)}
            />
          )}
          {showExport && (
            <ExportButton
              data={grid.processedData}
              columns={grid.visibleColumns}
              allColumns={columns}
              entityName={entityName}
            />
          )}
          {showImport && importConfig && onImport && (
            <button
              type="button"
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
          )}
          {headerAction}
        </div>
      </div>

      {/* Advanced filter bar */}
      {showFilters && (
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-950/5">
          <GridFilterBar
            columns={columns}
            activeFilters={grid.activeFilters}
            onAddFilter={grid.addFilter}
            onRemoveFilter={grid.removeFilter}
            onClearAll={grid.clearFilters}
          />
        </div>
      )}

      {/* Record count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500">
          {grid.filteredCount === grid.totalCount
            ? `${grid.totalCount} record${grid.totalCount !== 1 ? 's' : ''}`
            : `${grid.filteredCount} of ${grid.totalCount} records`}
        </p>
        {(grid.activeFilters.length > 0 || grid.searchQuery.trim()) && (
          <button
            type="button"
            onClick={grid.clearFilters}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Data table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {grid.visibleColumns.map(col => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 font-semibold text-gray-700 ${
                      col.sortable ? 'cursor-pointer select-none hover:bg-gray-100/80' : ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && grid.toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span className="tabular-nums text-gray-400" aria-hidden>
                          {grid.sortKey === col.key && grid.sortDir === 'asc'
                            ? '↑'
                            : grid.sortKey === col.key && grid.sortDir === 'desc'
                              ? '↓'
                              : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.processedData.length === 0 ? (
                <tr>
                  <td colSpan={grid.visibleColumns.length} className="px-4 py-12 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                grid.processedData.map((item, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(item)}
                    className={`border-b border-gray-100 transition-colors last:border-0 ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } ${onRowClick ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-gray-50/80'}`}
                  >
                    {grid.visibleColumns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-gray-800">
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rollup / Summary */}
      {showRollup && (rollupDimensions.length > 0 || rollupAggregates.length > 0) && (
        <RollupPanel
          data={grid.filteredData}
          dimensions={rollupDimensions}
          aggregates={rollupAggregates}
          totalCount={grid.totalCount}
        />
      )}

      {/* Import dialog */}
      {showImport && importConfig && onImport && (
        <ImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          config={importConfig}
          onConfirm={onImport}
          entityName={entityName}
        />
      )}
    </div>
  );
}

export default EnhancedDataGrid;
