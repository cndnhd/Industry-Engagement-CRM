'use client';

export type FilterDef = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type FilterBarProps = {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onClear?: () => void;
};

function FilterBar({ filters, values, onChange, onClear }: FilterBarProps) {
  const hasActiveFilter = Object.values(values).some(v => v !== '' && v !== undefined);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-950/5">
      {filters.map((f) => (
        <div key={f.key} className="flex min-w-[140px] flex-col gap-1">
          <label htmlFor={`filter-${f.key}`} className="text-xs font-medium text-gray-500">
            {f.label}
          </label>
          <select
            id={`filter-${f.key}`}
            value={values[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClear ?? (() => filters.forEach(f => onChange(f.key, '')))}
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default FilterBar;
