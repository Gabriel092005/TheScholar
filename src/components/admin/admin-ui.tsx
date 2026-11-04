import type { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const adminSurface =
  "rounded-2xl border border-gray-200/70 bg-background shadow-sm " +
  "dark:border-white/[0.06] dark:bg-[#151819]";

export const adminMuted = "text-gray-500 dark:text-zinc-500";

export const fragmentedTable =
  "w-full border-collapse text-left " +
  "[&_thead_th]:border-b [&_thead_th]:border-gray-200/70 [&_thead_th]:bg-gray-50/70 " +
  "[&_tbody_tr:last-child>td]:border-b-0 " +
  "dark:[&_thead_th]:border-white/[0.06] dark:[&_thead_th]:bg-white/[0.03]";

export const fragmentedRow =
  "group transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.04] " +
  "[&>td]:border-b [&>td]:border-gray-100/70 dark:[&>td]:border-white/[0.05] " +
  "[&>td]:align-middle";

type Tone = "emerald" | "blue" | "amber" | "violet" | "rose" | "teal" | "orange";

const TONES: Record<Tone, { chip: string; bar: string }> = {
  emerald: {
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  blue: {
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  amber: {
    chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  violet: {
    chip: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    bar: "bg-violet-500",
  },
  rose: {
    chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  teal: {
    chip: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    bar: "bg-teal-500",
  },
  orange: {
    chip: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    bar: "bg-orange-500",
  },
};

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(adminSurface, className)}>{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 flex items-center gap-1.5">
            <span className="size-1 rounded bg-emerald-400" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[24px]">
          {title}
        </h1>
        {description && (
          <p className={cn("mt-0.5 max-w-xl text-sm leading-relaxed", adminMuted)}>{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminPanel({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string; size?: number | string }>;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <AdminCard className={cn("overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 items-start gap-2">
            {Icon && (
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-zinc-400">
                <Icon className="size-3.5" />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
              )}
              {subtitle && <p className={cn("mt-0.5 text-xs", adminMuted)}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(bodyClassName ?? "px-4 pb-4")}>{children}</div>
    </AdminCard>
  );
}

export function TrendPill({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium",
        neutral
          ? "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-zinc-400"
          : positive
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
      )}
    >
      <Icon className="size-2.5" />
      {positive ? "+" : ""}
      {value.toLocaleString("pt-PT")}
      {suffix}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "emerald",
  accent = false,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  tone?: Tone;
  accent?: boolean;
  trend?: number;
  className?: string;
}) {
  const colors = TONES[tone];

if (accent) {
    return (
      <div
        className={cn(
          "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 text-white shadow-lg shadow-emerald-500/25 dark:border-emerald-400/30 dark:from-emerald-500 dark:via-emerald-600 dark:to-teal-700 dark:shadow-emerald-900/40 sm:p-5",
          className,
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 size-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-white/20 text-white backdrop-blur-sm">
            <Icon className="size-3.5" />
          </span>
          {typeof trend === "number" && (
            <span className="inline-flex items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm">
              {trend >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
              {trend >= 0 ? "+" : ""}
              {trend.toLocaleString("pt-PT")}%
            </span>
          )}
        </div>
        <div className="relative mt-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-white/75">{label}</p>
          <p className="mt-0.5 font-bold tracking-tight text-white">{value}</p>
          {hint && <p className="mt-0.5 text-[8px] text-white/70">{hint}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(adminSurface, "flex flex-col justify-between p-3 sm:p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("grid size-8 place-items-center rounded-lg", colors.chip)}>
          <Icon className="size-3.5" />
        </span>
        {typeof trend === "number" && <TrendPill value={trend} />}
      </div>
      <div className="mt-2">
        <p className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
        <p className={cn("mt-0.5 text-sm font-medium", adminMuted)}>{label}</p>
        {hint && <p className="mt-0.5 text-[8px] text-gray-400 dark:text-zinc-500">{hint}</p>}
      </div>
    </div>
  );
}

export function Donut({
  percent,
  size = 68,
  label,
  tone = "emerald",
}: {
  percent: number;
  size?: number;
  label?: ReactNode;
  tone?: Tone;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * c;

  const strokeColors = {
    emerald: "#4ade80",
    blue: "#60a5fa",
    amber: "#fbbf24",
    violet: "#a78bfa",
    rose: "#fb7185",
    teal: "#2dd4bf",
    orange: "#fb923c",
  };

  const strokeColor = strokeColors[tone] || "#60a5fa";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-gray-200 dark:stroke-white/10"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[8px] font-bold text-gray-900 dark:text-white">
          {label ?? `${Math.round(clamped)}%`}
        </span>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "emerald",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]", className)}>
      <div
        className={cn("h-full rounded-full transition-all", TONES[tone].bar)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string; size?: number | string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <span className="grid size-9 place-items-center rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-zinc-500">
        <Icon className="size-3.5" />
      </span>
      <p className="text-base font-medium text-gray-700 dark:text-zinc-300">{title}</p>
      {description && <p className={cn("max-w-xs text-sm", adminMuted)}>{description}</p>}
    </div>
  );
}

export { TONES as kpiTones };
export type { Tone as KpiTone };
