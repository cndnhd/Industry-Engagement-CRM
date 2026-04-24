'use client';

import { useMemo, useState } from 'react';

export type CollectionItem = { id: number; name: string; subtitle?: string };

type CollectionsSidebarProps = {
  title: string;
  items: CollectionItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate?: () => void;
  createLabel?: string;
  emptyHint?: string;
  loading?: boolean;
};

export default function CollectionsSidebar({
  title,
  items,
  selectedId,
  onSelect,
  onCreate,
  createLabel = 'New',
  emptyHint = 'Nothing here yet.',
  loading = false,
}: CollectionsSidebarProps) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(s)),
    );
  }, [items, q]);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              {createLabel}
            </button>
          )}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-4 text-center text-xs text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-gray-500">{emptyHint}</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                    selectedId === item.id
                      ? 'bg-indigo-50 font-medium text-indigo-900 ring-1 ring-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="line-clamp-2">{item.name}</span>
                  {item.subtitle && (
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{item.subtitle}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
