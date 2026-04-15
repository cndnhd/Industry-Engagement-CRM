'use client';

import { useState, useMemo } from 'react';
import type { RollupDimension, RollupAggregate } from './types';

type RollupPanelProps<T> = {
  data: T[];
  dimensions: RollupDimension[];
  aggregates: RollupAggregate[];
  totalCount: number;
};

interface GroupNode {
  key: string;
  count: number;
  aggregates: Record<string, number>;
  children?: Map<string, GroupNode>;
}

function buildGroups<T>(
  data: T[],
  dims: RollupDimension[],
  aggs: RollupAggregate[],
  depth: number = 0,
): Map<string, GroupNode> {
  const groups = new Map<string, GroupNode>();
  const dim = dims[depth];
  if (!dim) return groups;

  for (const item of data) {
    const key = dim.getGroup(item) || '(none)';
    let node = groups.get(key);
    if (!node) {
      node = { key, count: 0, aggregates: {} };
      for (const agg of aggs) {
        node.aggregates[agg.key] = agg.type === 'min' ? Infinity : agg.type === 'max' ? -Infinity : 0;
      }
      groups.set(key, node);
    }
    node.count++;

    for (const agg of aggs) {
      const val = agg.getValue ? agg.getValue(item) : 0;
      switch (agg.type) {
        case 'sum':
          node.aggregates[agg.key] += val;
          break;
        case 'min':
          if (val < node.aggregates[agg.key]) node.aggregates[agg.key] = val;
          break;
        case 'max':
          if (val > node.aggregates[agg.key]) node.aggregates[agg.key] = val;
          break;
        case 'average':
          node.aggregates[agg.key] += val;
          break;
      }
    }
  }

  for (const agg of aggs) {
    if (agg.type === 'average') {
      for (const node of groups.values()) {
        if (node.count > 0) node.aggregates[agg.key] /= node.count;
      }
    }
  }

  if (depth + 1 < dims.length) {
    const dataByGroup = new Map<string, T[]>();
    for (const item of data) {
      const key = dim.getGroup(item) || '(none)';
      if (!dataByGroup.has(key)) dataByGroup.set(key, []);
      dataByGroup.get(key)!.push(item);
    }
    for (const [key, node] of groups) {
      node.children = buildGroups(dataByGroup.get(key) ?? [], dims, aggs, depth + 1);
    }
  }

  return groups;
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function GroupRow({ node, aggregates, depth }: { node: GroupNode; aggregates: RollupAggregate[]; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.size > 0;

  return (
    <>
      <tr
        className={`border-b border-gray-100 ${depth === 0 ? 'bg-gray-50/80 font-medium' : 'bg-white'}`}
        style={{ paddingLeft: depth * 16 }}
      >
        <td className="px-4 py-2 text-sm text-gray-800" style={{ paddingLeft: 16 + depth * 20 }}>
          {hasChildren ? (
            <button type="button" onClick={() => setExpanded(p => !p)} className="mr-1.5 text-gray-400 hover:text-gray-600">
              {expanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="mr-4" />
          )}
          {node.key}
        </td>
        <td className="px-4 py-2 text-right text-sm tabular-nums text-gray-700">{node.count}</td>
        {aggregates.map(agg => (
          <td key={agg.key} className="px-4 py-2 text-right text-sm tabular-nums text-gray-700">
            {formatNum(node.aggregates[agg.key])}
          </td>
        ))}
      </tr>
      {expanded && hasChildren && [...node.children!.values()]
        .sort((a, b) => b.count - a.count)
        .map(child => (
          <GroupRow key={child.key} node={child} aggregates={aggregates} depth={depth + 1} />
        ))
      }
    </>
  );
}

function RollupPanel<T>({ data, dimensions, aggregates, totalCount }: RollupPanelProps<T>) {
  const [selectedDims, setSelectedDims] = useState<string[]>(
    dimensions.length > 0 ? [dimensions[0].key] : [],
  );

  const activeDims = useMemo(
    () => selectedDims.map(k => dimensions.find(d => d.key === k)!).filter(Boolean),
    [selectedDims, dimensions],
  );

  const groups = useMemo(
    () => buildGroups(data, activeDims, aggregates),
    [data, activeDims, aggregates],
  );

  function toggleDim(key: string) {
    setSelectedDims(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  }

  if (dimensions.length === 0 && aggregates.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
            <p className="text-xs text-gray-500">
              {data.length === totalCount
                ? `Showing all ${totalCount} records`
                : `${data.length} of ${totalCount} records (filtered)`}
            </p>
          </div>
          {dimensions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Group by:</span>
              {dimensions.map(d => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDim(d.key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    selectedDims.includes(d.key)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No records match the current filters.
        </div>
      ) : activeDims.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-2 font-semibold text-gray-700">
                  {activeDims.map(d => d.label).join(' → ')}
                </th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Count</th>
                {aggregates.map(agg => (
                  <th key={agg.key} className="px-4 py-2 text-right font-semibold text-gray-700">
                    {agg.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...groups.values()]
                .sort((a, b) => b.count - a.count)
                .map(node => (
                  <GroupRow key={node.key} node={node} aggregates={aggregates} depth={0} />
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{data.length}</div>
              <div className="text-xs text-gray-500">Total records</div>
            </div>
            {aggregates.map(agg => {
              let val = 0;
              if (agg.type === 'count') val = data.length;
              else {
                const nums = data.map(d => agg.getValue ? agg.getValue(d) : 0);
                if (agg.type === 'sum') val = nums.reduce((a, b) => a + b, 0);
                else if (agg.type === 'average') val = nums.reduce((a, b) => a + b, 0) / nums.length;
                else if (agg.type === 'min') val = Math.min(...nums);
                else if (agg.type === 'max') val = Math.max(...nums);
              }
              return (
                <div key={agg.key} className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">{formatNum(val)}</div>
                  <div className="text-xs text-gray-500">{agg.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default RollupPanel;
