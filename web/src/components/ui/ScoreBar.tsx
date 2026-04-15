'use client';

type ScoreBarProps = {
  label: string;
  value: number;
  max?: number;
  showValue?: boolean;
};

function barColorClass(pct: number): string {
  if (pct > 75) return 'bg-emerald-500';
  if (pct > 50) return 'bg-blue-500';
  if (pct > 25) return 'bg-amber-400';
  return 'bg-red-500';
}

function ScoreBar({ label, value, max = 5, showValue = true }: ScoreBarProps) {
  const safeMax = max > 0 ? max : 5;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const color = barColorClass(pct);

  return (
    <div className="flex items-center gap-3">
      <span className="min-w-[7rem] shrink-0 text-sm font-medium text-gray-700">{label}</span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-label={`${label}: ${value} of ${safeMax}`}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={safeMax}
        />
      </div>
      {showValue ? (
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-gray-600">{value}</span>
      ) : null}
    </div>
  );
}

export default ScoreBar;
