import type { ReactNode } from "react";

import type { TenantDashboardRoute } from "../types";

type RouteMetaItem = {
  id: TenantDashboardRoute;
  label: string;
  eyebrow: string;
  group: "core" | "operations" | "records" | "system";
};

type DashboardSidebarProps = {
  isLoading: boolean;
  tenantName?: string;
  unitLabel?: string;
  route: TenantDashboardRoute;
  routeMeta: RouteMetaItem[];
};

export function DashboardSidebar({
  isLoading,
  tenantName,
  unitLabel,
  route,
  routeMeta,
}: DashboardSidebarProps) {
  const groups: Array<{
    id: RouteMetaItem["group"];
    label: string;
  }> = [
    { id: "core", label: "Control Desk" },
    { id: "operations", label: "Daily Operations" },
    { id: "records", label: "Records & Structure" },
    { id: "system", label: "Administration" },
  ];

  return (
    <aside className="overflow-hidden rounded-[28px] border border-border-100 bg-white p-4 shadow-card xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
      <div className="rounded-[22px] bg-canvas-50 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded-full bg-surface-100" />
            <div className="h-7 w-40 animate-pulse rounded-full bg-surface-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-surface-100" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-500">
                  Building Admin
                </p>
                <h1 className="mt-2 text-xl font-black tracking-[-0.04em] text-brand-900">
                  {tenantName}
                </h1>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 text-sm font-bold text-white">
                {getTenantInitials(tenantName)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-500">{unitLabel}</p>
          </>
        )}
      </div>

      <div className="mt-5 space-y-4 xl:h-[calc(100%-10.5rem)] xl:overflow-y-auto xl:pr-1">
        {groups.map((group) => {
          const items = routeMeta.filter((item) => item.group === group.id);

          if (items.length === 0) {
            return null;
          }

          return (
            <section key={group.id} className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                {group.label}
              </p>
              <nav className="space-y-1 rounded-[20px] p-1">
                {items.map((item) => {
                  const isActive = item.id === route;

                  return (
                    <a
                      key={item.id}
                      href={`#/${item.id}`}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                        isActive
                          ? "bg-brand-100 text-brand-900"
                          : "text-ink-700 hover:bg-canvas-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                          isActive
                            ? "bg-brand-900 text-white"
                            : "bg-white text-brand-900 ring-1 ring-border-100"
                        }`}
                      >
                        <SidebarIcon route={item.id} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                            isActive ? "text-brand-900/60" : "text-ink-500"
                          }`}
                        >
                          {item.eyebrow}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-brand-900">
                          {item.label}
                        </p>
                      </div>
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          isActive ? "bg-brand-900" : "bg-border-200"
                        }`}
                      />
                    </a>
                  );
                })}
              </nav>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function getTenantInitials(tenantName?: string) {
  if (!tenantName) {
    return "TS";
  }

  return tenantName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SidebarIcon({ route }: { route: TenantDashboardRoute }) {
  const iconByRoute: Record<TenantDashboardRoute, ReactNode> = {
    overview: (
      <SvgIcon>
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
      </SvgIcon>
    ),
    announcements: (
      <SvgIcon>
        <path d="M5 14.5V9.7a1.8 1.8 0 0 1 1.2-1.7l9-3.2A1.5 1.5 0 0 1 17 6.2v11.6a1.5 1.5 0 0 1-1.8 1.4l-3.2-.7v1a2 2 0 1 1-4 0v-1.8H7a2 2 0 0 1-2-2.2Z" />
      </SvgIcon>
    ),
    support: (
      <SvgIcon>
        <path d="M12 21a8.5 8.5 0 1 1 6.8-3.4L21 20l-4.1-1.3A8.5 8.5 0 0 1 12 21Z" />
      </SvgIcon>
    ),
    feedback: (
      <SvgIcon>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
      </SvgIcon>
    ),
    visitors: (
      <SvgIcon>
        <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Z" />
      </SvgIcon>
    ),
    approvals: (
      <SvgIcon>
        <path d="M6 5h9l3 3v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2.5 9.2 2 2.1 4.5-5" />
      </SvgIcon>
    ),
    documents: (
      <SvgIcon>
        <path d="M7 4h7l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm7 1.5V9h3.5" />
      </SvgIcon>
    ),
    billing: (
      <SvgIcon>
        <path d="M6 7.5h12M6 12h12M6 16.5h7M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      </SvgIcon>
    ),
    strata: (
      <SvgIcon>
        <path d="M12 4 5 8v8l7 4 7-4V8l-7-4Zm0 0v16M5 8l7 4 7-4" />
      </SvgIcon>
    ),
    access: (
      <SvgIcon>
        <path d="M8 11V8.5a4 4 0 1 1 8 0V11m-8 0h8m-8 0H7a1 1 0 0 0-1 1v7h12v-7a1 1 0 0 0-1-1h-1" />
      </SvgIcon>
    ),
  };

  return iconByRoute[route];
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
