import type {
  DashboardAction,
  DashboardActivity,
  DashboardModule,
  DashboardStat,
  DashboardTone,
} from "../types";

const statToneClass = {
  brand: "bg-brand-100 text-brand-900",
  success: "bg-emerald-50 text-success-700",
  warning: "bg-amber-50 text-warning-700",
} as const;

export function OverviewStatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="rounded-lg border border-border-100 bg-white p-5 shadow-card">
      <span
        className={`inline-flex rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statToneClass[stat.tone]}`}
      >
        {stat.label}
      </span>
      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-brand-900">
        {stat.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink-500">{stat.hint}</p>
    </article>
  );
}

export function OverviewActionCard({ action }: { action: DashboardAction }) {
  return (
    <article className="rounded-lg border border-border-100 bg-canvas-50 p-5 transition hover:-translate-y-0.5 hover:shadow-card">
      <h3 className="text-lg font-bold text-brand-900">{action.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-500">{action.description}</p>
      <button className="mt-4 inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900">
        Open skeleton
      </button>
    </article>
  );
}

export function OverviewActivityCard({ activity }: { activity: DashboardActivity }) {
  return (
    <article className="rounded-lg border border-border-100 bg-canvas-50 p-4">
      <div className="flex items-start gap-3">
        <ToneDot tone={activity.tone} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{activity.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
            {activity.meta}
          </p>
        </div>
      </div>
    </article>
  );
}

export function OverviewModuleCard({ module }: { module: DashboardModule }) {
  return (
    <article className="rounded-lg border border-border-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-brand-900">{module.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">{module.description}</p>
        </div>
        <span className="rounded-pill bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-900">
          {module.status}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-ink-700">
        {module.items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-900" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ToneDot({ tone }: { tone: DashboardTone }) {
  return (
    <span
      className={`mt-1 h-2.5 w-2.5 rounded-full ${
        tone === "warning"
          ? "bg-warning-700"
          : tone === "success"
            ? "bg-success-700"
            : "bg-brand-900"
      }`}
    />
  );
}
