import { Suspense, lazy, useEffect, useState } from "react";

import { DashboardPanel } from "./components/dashboard-panel";
import { DashboardHero } from "./components/dashboard-hero";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import { ApprovalsRoute } from "./routes/approvals-route";
import { useTenantDashboardQuery } from "./queries/use-tenant-dashboard-query";
import { OverviewRoute } from "./routes/overview-route";
import { StrataRoute } from "./routes/strata-route";
import type { TenantDashboardRoute } from "./types";

const BillingRoute = lazy(() =>
  import("./routes/billing-route").then((module) => ({
    default: module.BillingRoute,
  })),
);

const DocumentsRoute = lazy(() =>
  import("./routes/documents-route").then((module) => ({
    default: module.DocumentsRoute,
  })),
);

const DocumentRequestsRoute = lazy(() =>
  import("./routes/document-requests-route").then((module) => ({
    default: module.DocumentRequestsRoute,
  })),
);

const VisitorsRoute = lazy(() =>
  import("./routes/visitors-route").then((module) => ({
    default: module.VisitorsRoute,
  })),
);

const SupportRoute = lazy(() =>
  import("./routes/support-route").then((module) => ({
    default: module.SupportRoute,
  })),
);

const FeedbackRoute = lazy(() =>
  import("./routes/feedback-route").then((module) => ({
    default: module.FeedbackRoute,
  })),
);

const AnnouncementsRoute = lazy(() =>
  import("./routes/announcements-route").then((module) => ({
    default: module.AnnouncementsRoute,
  })),
);

const AccessRoute = lazy(() =>
  import("./routes/access-route").then((module) => ({
    default: module.AccessRoute,
  })),
);

const routeMeta: Array<{
  id: TenantDashboardRoute;
  label: string;
  eyebrow: string;
  group: "core" | "operations" | "records" | "system";
}> = [
  { id: "overview", label: "Overview", eyebrow: "Control Desk", group: "core" },
  { id: "announcements", label: "Announcements", eyebrow: "Communications", group: "operations" },
  { id: "support", label: "Complaints", eyebrow: "Operations", group: "operations" },
  { id: "feedback", label: "Building Feedback", eyebrow: "Resident Voice", group: "operations" },
  { id: "visitors", label: "Visitors", eyebrow: "Access Control", group: "operations" },
  { id: "approvals", label: "Approvals", eyebrow: "Resident Records", group: "operations" },
  { id: "documents", label: "Documents", eyebrow: "Repository", group: "records" },
  { id: "documentRequests", label: "Document Requests", eyebrow: "Resident Requests", group: "records" },
  { id: "billing", label: "Billing Import", eyebrow: "Finance Ops", group: "records" },
  { id: "strata", label: "Building Setup", eyebrow: "Asset Structure", group: "records" },
  { id: "access", label: "Admin Access", eyebrow: "System", group: "system" },
];

function getRouteFromHash(): TenantDashboardRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");

  if (routeMeta.some((item) => item.id === hash)) {
    return hash as TenantDashboardRoute;
  }

  return "overview";
}

export function TenantDashboardPage() {
  const dashboardQuery = useTenantDashboardQuery();
  const [route, setRoute] = useState<TenantDashboardRoute>(getRouteFromHash);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);

    if (!window.location.hash) {
      window.location.hash = "/overview";
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const activePage = dashboardQuery.data?.pages[route];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(207,230,242,0.9),transparent_28%),linear-gradient(180deg,#f6fafe_0%,#eef4fb_100%)] px-4 py-6 text-ink-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          isLoading={dashboardQuery.isLoading}
          tenantName={dashboardQuery.data?.tenantName}
          unitLabel={dashboardQuery.data?.unitLabel}
          route={route}
          routeMeta={routeMeta}
        />

        <div className="space-y-6">
          <DashboardHero
            isLoading={dashboardQuery.isLoading}
            unitLabel={dashboardQuery.data?.unitLabel}
            title={activePage?.title ?? dashboardQuery.data?.greeting}
            description={activePage?.description ?? dashboardQuery.data?.overview}
            currentViewLabel={routeMeta.find((item) => item.id === route)?.label}
          />

          {route === "overview" ? (
            <OverviewRoute
              isLoading={dashboardQuery.isLoading}
              dashboard={dashboardQuery.data}
            />
          ) : route === "visitors" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <VisitorsRoute
                isLoading={dashboardQuery.isLoading}
                visitorAdmin={dashboardQuery.data?.visitorAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "billing" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <BillingRoute
                isLoading={dashboardQuery.isLoading}
                billingAdmin={dashboardQuery.data?.billingAdmin}
                strata={dashboardQuery.data?.strata}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "documents" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <DocumentsRoute
                isLoading={dashboardQuery.isLoading}
                documentsAdmin={dashboardQuery.data?.documentsAdmin}
                strata={dashboardQuery.data?.strata}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "documentRequests" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <DocumentRequestsRoute
                isLoading={dashboardQuery.isLoading}
                documentsAdmin={dashboardQuery.data?.documentsAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "support" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <SupportRoute
                isLoading={dashboardQuery.isLoading}
                supportAdmin={dashboardQuery.data?.supportAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "feedback" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <FeedbackRoute
                isLoading={dashboardQuery.isLoading}
                feedbackAdmin={dashboardQuery.data?.feedbackAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "announcements" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <AnnouncementsRoute
                isLoading={dashboardQuery.isLoading}
                announcementAdmin={dashboardQuery.data?.announcementAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : route === "strata" ? (
            <StrataRoute
              isLoading={dashboardQuery.isLoading}
              strata={dashboardQuery.data?.strata}
              visitorAdmin={dashboardQuery.data?.visitorAdmin}
              sections={activePage?.sections ?? []}
            />
          ) : route === "approvals" ? (
            <ApprovalsRoute
              isLoading={dashboardQuery.isLoading}
              approvals={dashboardQuery.data?.approvals}
              sections={activePage?.sections ?? []}
            />
          ) : route === "access" ? (
            <Suspense fallback={<RouteLoadingPanel />}>
              <AccessRoute
                isLoading={dashboardQuery.isLoading}
                accessAdmin={dashboardQuery.data?.accessAdmin}
                sections={activePage?.sections ?? []}
              />
            </Suspense>
          ) : (
            null
          )}
        </div>
      </div>
    </main>
  );
}

function RouteLoadingPanel() {
  return (
    <DashboardPanel
      title="Loading Route"
      description="Preparing the selected admin workspace..."
    >
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded-full bg-surface-100" />
        <div className="h-32 rounded-lg bg-canvas-50" />
      </div>
    </DashboardPanel>
  );
}
