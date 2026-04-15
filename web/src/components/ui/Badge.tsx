'use client';

export type BadgeColor =
  | "emerald"
  | "blue"
  | "amber"
  | "slate"
  | "red"
  | "purple"
  | "indigo"
  | "rose"
  | "cyan"
  | "gray";

const COLOR_STYLES: Record<BadgeColor, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  slate: "bg-slate-50 text-slate-700 ring-slate-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cyan: "bg-cyan-50 text-cyan-800 ring-cyan-600/20",
  gray: "bg-gray-50 text-gray-700 ring-gray-600/20",
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

type BadgeProps = {
  label: string;
  color?: BadgeColor;
  size?: "sm" | "md";
};

function Badge({ label, color = "gray", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${COLOR_STYLES[color]} ${SIZE_STYLES[size]}`}
    >
      {label}
    </span>
  );
}

export default Badge;
