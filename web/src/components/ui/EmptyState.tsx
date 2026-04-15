'use client';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 ring-1 ring-gray-200/80">
        <svg
          className="h-7 w-7 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.25}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.792m-13.5 0V9.75m0 3.75V18"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
