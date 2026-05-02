import type { ReactNode } from "react";

type DashboardStatTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "progress";

const toneClasses: Record<
  DashboardStatTone,
  {
    badge: string;
    accent: string;
    value: string;
  }
> = {
  neutral: {
    badge: "bg-surface-100 text-ink-700",
    accent: "bg-slate-200/70",
    value: "text-ink-900",
  },
  brand: {
    badge: "bg-brand-100 text-brand-900",
    accent: "bg-brand-200/70",
    value: "text-brand-900",
  },
  success: {
    badge: "bg-emerald-50 text-success-700",
    accent: "bg-emerald-200/70",
    value: "text-brand-900",
  },
  warning: {
    badge: "bg-amber-50 text-warning-700",
    accent: "bg-amber-200/70",
    value: "text-brand-900",
  },
  danger: {
    badge: "bg-rose-50 text-rose-700",
    accent: "bg-rose-200/70",
    value: "text-brand-900",
  },
  progress: {
    badge: "bg-sky-50 text-sky-700",
    accent: "bg-sky-200/70",
    value: "text-brand-900",
  },
};

type DashboardStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: DashboardStatTone;
  className?: string;
};

export function DashboardStatCard({
  label,
  value,
  hint,
  tone = "neutral",
  className = "",
}: DashboardStatCardProps) {
  const toneClass = toneClasses[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-[24px] border border-border-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,253,0.98)_100%)] p-5 shadow-card ${className}`.trim()}
    >
      <div
        className={`pointer-events-none absolute right-[-18px] top-[-18px] h-24 w-24 rounded-full blur-2xl ${toneClass.accent}`}
      />
      <div className="relative flex min-h-[128px] flex-col">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass.badge}`}
          >
            {label}
          </span>
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-border-200" />
        </div>
        <p className={`mt-5 text-3xl font-black tracking-[-0.04em] ${toneClass.value}`}>
          {value}
        </p>
        {hint ? (
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink-500">{hint}</p>
        ) : (
          <div className="mt-auto pt-4">
            <div className="h-px w-16 bg-border-100" />
          </div>
        )}
      </div>
    </article>
  );
}
