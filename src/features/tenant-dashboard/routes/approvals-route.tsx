import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useSaveUserApprovalsMutation } from "../queries/use-save-user-approvals-mutation";
import type {
  DashboardPageSection,
  UnitMemberApproval,
  UnitMemberApprovalStatus,
  UserApprovals,
} from "../types";

type ApprovalsRouteProps = {
  isLoading: boolean;
  approvals?: UserApprovals;
  sections: DashboardPageSection[];
};

const statusToneClass: Record<UnitMemberApprovalStatus, string> = {
  pending: "bg-amber-50 text-warning-700",
  approved: "bg-emerald-50 text-success-700",
  rejected: "bg-rose-50 text-rose-700",
};

export function ApprovalsRoute({
  isLoading,
  approvals,
  sections: _sections,
}: ApprovalsRouteProps) {
  const saveUserApprovalsMutation = useSaveUserApprovalsMutation();
  const approvalList = approvals?.approvals ?? [];
  const [statusFilter, setStatusFilter] = useState<"all" | UnitMemberApprovalStatus>(
    "all",
  );
  const [documentFilter, setDocumentFilter] = useState<
    "all" | "missing" | "expired" | "complete"
  >("all");
  const [sortMode, setSortMode] = useState<"newest" | "unit-code" | "member-name">(
    "newest",
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const filteredApprovals = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    const nextApprovals = approvalList.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const matchesDocumentFilter =
        documentFilter === "all"
          ? true
          : documentFilter === "missing"
            ? item.documents.some((document) => document.status === "missing")
            : documentFilter === "expired"
              ? item.documents.some((document) => document.status === "expired")
              : item.documents.every((document) => document.status === "submitted");
      const matchesSearch =
        query.length === 0
          ? true
          : [
              item.fullName,
              item.unitName,
              item.residentCode,
              item.buildingName,
              item.areaName,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

      return matchesStatus && matchesDocumentFilter && matchesSearch;
    });

    return nextApprovals.sort((left, right) => {
      if (sortMode === "unit-code") {
        return left.unitName.localeCompare(right.unitName);
      }

      if (sortMode === "member-name") {
        return left.fullName.localeCompare(right.fullName);
      }

      return right.submittedAt.localeCompare(left.submittedAt);
    });
  }, [approvalList, documentFilter, searchValue, sortMode, statusFilter]);

  useEffect(() => {
    if (
      selectedApprovalId &&
      !filteredApprovals.some((item) => item.id === selectedApprovalId)
    ) {
      setSelectedApprovalId(null);
    }
  }, [filteredApprovals, selectedApprovalId]);

  const selectedApproval = selectedApprovalId
    ? filteredApprovals.find((item) => item.id === selectedApprovalId) ?? null
    : null;

  const approvalStats = useMemo(
    () => ({
      pending: approvalList.filter((item) => item.status === "pending").length,
      approved: approvalList.filter((item) => item.status === "approved").length,
      rejected: approvalList.filter((item) => item.status === "rejected").length,
    }),
    [approvalList],
  );

  function updateApprovalStatus(
    approvalId: string,
    nextStatus: UnitMemberApprovalStatus,
  ) {
    saveUserApprovalsMutation.mutate({
      approvals: approvalList.map((item) =>
        item.id === approvalId ? { ...item, status: nextStatus } : item,
      ),
    });
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Pending Review"
          value={approvalStats.pending}
          tone="warning"
          hint="Members waiting to be attached to their target unit."
        />
        <DashboardStatCard
          label="Approved Members"
          value={approvalStats.approved}
          tone="success"
          hint="Unit members already allowed into the active unit roster."
        />
        <DashboardStatCard
          label="Rejected Requests"
          value={approvalStats.rejected}
          tone="danger"
          hint="Requests blocked due to incomplete or invalid submission."
        />
      </section>

      {selectedApproval ? (
        <DashboardModal
          title="Member Review"
          description="Approve or reject the exact user record before it becomes an active unit member."
          onClose={() => setSelectedApprovalId(null)}
        >
          <ApprovalDetailCard
            approval={selectedApproval}
            onApprove={() => updateApprovalStatus(selectedApproval.id, "approved")}
            onReject={() => updateApprovalStatus(selectedApproval.id, "rejected")}
          />
        </DashboardModal>
      ) : null}

      <section>
        <DashboardPanel
          title={approvals?.title ?? "Approval Queue"}
          description={approvals?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search member, unit, or resident code"
                className="min-w-[220px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | UnitMemberApprovalStatus,
                  )
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={documentFilter}
                onChange={(event) =>
                  setDocumentFilter(
                    event.target.value as "all" | "missing" | "expired" | "complete",
                  )
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All documents</option>
                <option value="complete">Complete only</option>
                <option value="missing">Missing docs</option>
                <option value="expired">Expired docs</option>
              </select>
              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(
                    event.target.value as "newest" | "unit-code" | "member-name",
                  )
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="newest">Sort: newest</option>
                <option value="unit-code">Sort: unit code</option>
                <option value="member-name">Sort: member name</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredApprovals.length} of {approvalList.length} records
              </p>
            ) : null}

            <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <ApprovalQueueSkeleton key={index} />
                ))
                : filteredApprovals.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 transition ${
                      item.id === selectedApprovalId
                        ? "border-brand-900 bg-brand-100/40 shadow-card"
                        : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedApprovalId(item.id)}
                      className="w-full text-left"
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-900">
                          {item.fullName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                          {item.relationship} • {item.unitName}
                        </p>
                      </div>
                      <span
                        className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-500">
                      {item.buildingName} • {item.areaName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                      {item.submittedAt}
                    </p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateApprovalStatus(item.id, "approved")}
                        className="inline-flex rounded-pill border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-success-700"
                      >
                        Quick approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateApprovalStatus(item.id, "rejected")}
                        className="inline-flex rounded-pill border border-rose-700 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Quick reject
                      </button>
                      <span className="inline-flex rounded-pill bg-surface-100 px-3 py-1.5 text-xs font-semibold text-ink-500">
                        {buildDocumentSummary(item)}
                      </span>
                    </div>
                  </div>
                ))}
              {!isLoading && filteredApprovals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-5 text-sm text-ink-500">
                  No approval records match the current filter or search.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function ApprovalDetailCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: UnitMemberApproval;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
            Unit Member
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {approval.fullName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {approval.relationship} for {approval.buildingName} • {approval.unitName}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[approval.status]}`}
        >
          {approval.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailBlock label="Resident Code" value={approval.residentCode} />
        <DetailBlock label="Submitted At" value={approval.submittedAt} />
        <DetailBlock label="Email" value={approval.email} />
        <DetailBlock label="Phone" value={approval.phone} />
        <DetailBlock label="Area" value={approval.areaName} />
        <DetailBlock label="Unit" value={approval.unitName} />
      </div>

      <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Admin Notes</p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{approval.notes}</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          Supporting Documents
        </p>
        {approval.documents.map((document) => (
          <div
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-100 bg-white p-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-900">{document.label}</p>
              <p className="mt-1 text-sm text-ink-500">{document.fileName}</p>
            </div>
            <span
              className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                document.status === "submitted"
                  ? "bg-emerald-50 text-success-700"
                  : document.status === "expired"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-amber-50 text-warning-700"
              }`}
            >
              {document.status}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex rounded-pill border border-emerald-700 bg-emerald-50 px-4 py-2 text-sm font-semibold text-success-700"
        >
          Approve Member
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex rounded-pill border border-rose-700 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
        >
          Reject Request
        </button>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function ApprovalQueueSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function buildDocumentSummary(approval: UnitMemberApproval) {
  const missingCount = approval.documents.filter(
    (document) => document.status === "missing",
  ).length;
  const expiredCount = approval.documents.filter(
    (document) => document.status === "expired",
  ).length;

  if (expiredCount > 0) {
    return `${expiredCount} expired document${expiredCount > 1 ? "s" : ""}`;
  }

  if (missingCount > 0) {
    return `${missingCount} missing document${missingCount > 1 ? "s" : ""}`;
  }

  return "All documents complete";
}
