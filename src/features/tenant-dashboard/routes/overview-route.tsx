import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import type {
  DashboardAction,
  DashboardModule,
  DashboardTone,
  TenantDashboard,
} from "../types";

type OverviewRouteProps = {
  isLoading: boolean;
  dashboard?: TenantDashboard;
};

const actionHrefById: Partial<Record<DashboardAction["id"], string>> = {
  "publish-announcement": "#/announcements",
  "review-complaints": "#/support",
  "upload-documents": "#/documents",
  "configure-strata": "#/strata",
  "billing-import": "#/billing",
  approvals: "#/approvals",
};

const moduleHrefById: Partial<Record<DashboardModule["id"], string>> = {
  announcements: "#/announcements",
  support: "#/support",
  visitors: "#/visitors",
  documents: "#/documents",
  billing: "#/billing",
  strata: "#/strata",
};

const toneClassByTone: Record<DashboardTone, string> = {
  brand: "bg-brand-100 text-brand-900",
  success: "bg-emerald-50 text-success-700",
  warning: "bg-amber-50 text-warning-700",
};

export function OverviewRoute({ isLoading, dashboard }: OverviewRouteProps) {
  const priorities = dashboard ? buildPriorities(dashboard) : [];
  const quickActions = dashboard?.actions ?? [];
  const modules = dashboard?.modules ?? [];
  const activities = dashboard?.activities ?? [];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <StatSkeleton key={index} />)
          : dashboard?.stats.map((stat) => (
              <DashboardStatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                tone={stat.tone}
              />
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <DashboardPanel
          title="Priority Queue"
          description="The main items the building team should clear first today."
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <PrioritySkeleton key={index} />
                ))
              : priorities.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border-100 bg-canvas-50 p-4 transition hover:border-brand-900/20 hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${toneClassByTone[item.tone]}`}
                        >
                          {item.eyebrow}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                          {item.meta}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-bold text-brand-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
                    </div>
                    <span className="rounded-pill border border-border-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                      Open
                    </span>
                  </a>
                ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Quick Actions"
          description="Shortcuts into the building admin workflows used most often."
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <ActionSkeleton key={index} />)
              : quickActions.map((action) => (
                  <a
                    key={action.id}
                    href={actionHrefById[action.id] ?? "#/overview"}
                    className="block rounded-2xl border border-border-100 bg-white p-4 transition hover:border-brand-900/20 hover:bg-canvas-50"
                  >
                    <p className="text-sm font-bold text-brand-900">{action.title}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {action.description}
                    </p>
                    <span className="mt-4 inline-flex rounded-pill bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-900">
                      Open workspace
                    </span>
                  </a>
                ))}
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardPanel
          title="Operations Feed"
          description="Recent updates across communications, access control, and finance."
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <ActivitySkeleton key={index} />
                ))
              : activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl border border-border-100 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${toneClassByTone[activity.tone]}`}
                      >
                        {activity.meta}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-ink-700">
                      {activity.title}
                    </p>
                  </div>
                ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Module Access"
          description="Use this as the main handoff map for daily building administration."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => <ModuleSkeleton key={index} />)
              : modules.map((module) => (
                  <a
                    key={module.id}
                    href={moduleHrefById[module.id] ?? "#/overview"}
                    className="rounded-2xl border border-border-100 bg-canvas-50 p-5 transition hover:border-brand-900/20 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-brand-900">{module.title}</p>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {module.description}
                        </p>
                      </div>
                      <span className="rounded-pill bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                        {module.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {module.items.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-pill border border-border-100 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function buildPriorities(dashboard: TenantDashboard) {
  const complaints = dashboard.stats.find((item) => item.id === "cases")?.value ?? "0";
  const visitors = dashboard.stats.find((item) => item.id === "visitors")?.value ?? "0";
  const announcements =
    dashboard.stats.find((item) => item.id === "announcements")?.value ?? "0";

  return [
    {
      id: "complaints",
      eyebrow: "Complaints",
      title: `${complaints} open resident cases are still in motion`,
      description:
        "Review unresolved complaints, assign vendors quickly, and close the cases that already have field updates.",
      meta: "Highest service pressure",
      href: "#/support",
      tone: "warning" as const,
    },
    {
      id: "visitors",
      eyebrow: "Visitor Control",
      title: `${visitors} visitor requests need host or parking review`,
      description:
        "Clear the pending queue before arrival time so security and parking teams are working with the final list.",
      meta: "Time-sensitive",
      href: "#/visitors",
      tone: "brand" as const,
    },
    {
      id: "announcements",
      eyebrow: "Communications",
      title: `${announcements} active resident notices are currently live`,
      description:
        "Check whether any live announcement should be refreshed, expired, or replaced with a new operational notice.",
      meta: "Resident visibility",
      href: "#/announcements",
      tone: "success" as const,
    },
  ];
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-white p-5 shadow-card">
      <div className="h-7 w-40 animate-pulse rounded-pill bg-surface-100" />
      <div className="mt-4 h-10 w-24 animate-pulse rounded-2xl bg-surface-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function PrioritySkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
      <div className="h-5 w-28 animate-pulse rounded-pill bg-surface-100" />
      <div className="mt-3 h-5 w-4/5 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function ActionSkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-white p-4">
      <div className="h-5 w-32 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-4 h-6 w-28 animate-pulse rounded-pill bg-surface-100" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-white p-4">
      <div className="h-5 w-36 animate-pulse rounded-pill bg-surface-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function ModuleSkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-canvas-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-32 animate-pulse rounded-full bg-surface-100" />
        <div className="h-6 w-16 animate-pulse rounded-pill bg-surface-100" />
      </div>
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-pill bg-surface-100" />
        <div className="h-6 w-20 animate-pulse rounded-pill bg-surface-100" />
        <div className="h-6 w-14 animate-pulse rounded-pill bg-surface-100" />
      </div>
    </div>
  );
}
