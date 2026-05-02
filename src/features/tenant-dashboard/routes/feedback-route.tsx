import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import type {
  DashboardPageSection,
  FeedbackAdmin,
  FeedbackCategory,
  FeedbackSource,
  FeedbackStatus,
} from "../types";

type FeedbackRouteProps = {
  isLoading: boolean;
  feedbackAdmin?: FeedbackAdmin;
  sections: DashboardPageSection[];
};

const statusToneClass: Record<FeedbackStatus, string> = {
  new: "bg-amber-50 text-warning-700",
  reviewed: "bg-sky-50 text-sky-700",
  shared: "bg-emerald-50 text-success-700",
};

const sentimentToneClass = {
  positive: "bg-emerald-50 text-success-700",
  neutral: "bg-surface-100 text-ink-700",
  negative: "bg-rose-50 text-rose-700",
};

export function FeedbackRoute({
  isLoading,
  feedbackAdmin,
  sections: _sections,
}: FeedbackRouteProps) {
  const feedbackList = feedbackAdmin?.items ?? [];
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | FeedbackSource>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | FeedbackCategory>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const filteredFeedback = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return feedbackList.filter((item) => {
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesSource = sourceFilter === "all" ? true : item.source === sourceFilter;
      const matchesCategory =
        categoryFilter === "all" ? true : item.category === categoryFilter;
      const matchesSearch =
        query.length === 0
          ? true
          : [
              item.title,
              item.message,
              item.residentName,
              item.residentCode,
              item.unitCode,
              item.category,
              item.tags.join(" "),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

      return matchesStatus && matchesSource && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, feedbackList, searchValue, sourceFilter, statusFilter]);

  useEffect(() => {
    if (
      selectedFeedbackId &&
      !filteredFeedback.some((item) => item.id === selectedFeedbackId)
    ) {
      setSelectedFeedbackId(null);
    }
  }, [filteredFeedback, selectedFeedbackId]);

  const selectedFeedback = selectedFeedbackId
    ? filteredFeedback.find((item) => item.id === selectedFeedbackId) ?? null
    : null;
  const feedbackStats = useMemo(
    () => ({
      new: feedbackList.filter((item) => item.status === "new").length,
      reviewed: feedbackList.filter((item) => item.status === "reviewed").length,
      shared: feedbackList.filter((item) => item.status === "shared").length,
      averageRating:
        feedbackList.length === 0
          ? 0
          : Number(
              (
                feedbackList.reduce((sum, item) => sum + item.rating, 0) / feedbackList.length
              ).toFixed(1),
            ),
    }),
    [feedbackList],
  );

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="New Feedback"
          value={feedbackStats.new}
          tone="warning"
          hint="Fresh items that still need management or operations review."
        />
        <DashboardStatCard
          label="Reviewed"
          value={feedbackStats.reviewed}
          tone="progress"
          hint="Already inspected and narrowed into a clear service issue."
        />
        <DashboardStatCard
          label="Shared"
          value={feedbackStats.shared}
          tone="success"
          hint="Forwarded internally for action or follow-up."
        />
        <DashboardStatCard
          label="Average Rating"
          value={feedbackStats.averageRating}
          tone="brand"
          hint="Current sentiment level across all submitted feedback."
        />
      </section>

      {selectedFeedback ? (
        <DashboardModal
          title={feedbackAdmin?.helperTitle ?? "Feedback Detail"}
          description={
            feedbackAdmin?.helperDescription ??
            "Read the resident summary and determine the next management follow-up."
          }
          onClose={() => setSelectedFeedbackId(null)}
        >
          <FeedbackDetailContent selectedFeedback={selectedFeedback} />
        </DashboardModal>
      ) : null}

      <section>
        <DashboardPanel
          title={feedbackAdmin?.title ?? "Building Feedback Inbox"}
          description={feedbackAdmin?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search title, resident, category, or tags"
                className="min-w-[220px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | FeedbackStatus)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="shared">Shared</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as "all" | FeedbackSource)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All sources</option>
                <option value="management_portal">Management Portal</option>
                <option value="web">Web</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as "all" | FeedbackCategory)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All categories</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Experience">General Experience</option>
                <option value="Billing">Billing</option>
                <option value="Facilities">Facilities</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredFeedback.length} of {feedbackList.length} feedback records
              </p>
            ) : null}

            <div className="space-y-3">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <FeedbackQueueSkeleton key={index} />
                  ))
                : filteredFeedback.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFeedbackId(item.id)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        item.id === selectedFeedbackId
                          ? "border-brand-900 bg-brand-100/40 shadow-card"
                        : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-900">{item.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                            {item.category} • {item.unitCode} • {formatSourceLabel(item.source)}
                          </p>
                        </div>
                        <span
                          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[item.status]}`}
                        >
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-500">
                        {item.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${sentimentToneClass[item.sentiment]}`}
                        >
                          {item.sentiment}
                        </span>
                        <span className="rounded-pill bg-canvas-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                          {renderStars(item.rating)}
                        </span>
                      </div>
                    </button>
                  ))}
              {!isLoading && filteredFeedback.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-5 text-sm text-ink-500">
                  No feedback records match the current filters.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function FeedbackDetailContent({
  selectedFeedback,
}: {
  selectedFeedback: FeedbackAdmin["items"][number];
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
            Building Feedback
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {selectedFeedback.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {selectedFeedback.residentName} • {selectedFeedback.unitCode} •{" "}
            {selectedFeedback.buildingName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[selectedFeedback.status]}`}
          >
            {formatStatusLabel(selectedFeedback.status)}
          </span>
          <span className="rounded-pill bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-900">
            {formatSourceLabel(selectedFeedback.source)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FeedbackDetailBlock label="Resident Code" value={selectedFeedback.residentCode} />
        <FeedbackDetailBlock label="Submitted At" value={selectedFeedback.submittedAt} />
        <FeedbackDetailBlock label="Category" value={selectedFeedback.category} />
        <FeedbackDetailBlock label="Rating" value={renderStars(selectedFeedback.rating)} />
      </div>

      <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Summary</p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{selectedFeedback.summary}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Tags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFeedback.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill border border-border-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackDetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function FeedbackQueueSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-3/5 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function formatStatusLabel(status: FeedbackStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatSourceLabel(source: FeedbackSource) {
  return source === "management_portal" ? "Management Portal" : "Web";
}

function renderStars(rating: number) {
  return `${rating}/5`;
}
