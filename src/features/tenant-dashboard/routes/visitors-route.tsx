import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useSaveVisitorAdminMutation } from "../queries/use-save-visitor-admin-mutation";
import type {
  DashboardPageSection,
  VisitorAdmin,
  VisitorApproval,
  VisitorApprovalStatus,
  VisitorParkingQuotaConfig,
} from "../types";

type VisitorsRouteProps = {
  isLoading: boolean;
  visitorAdmin?: VisitorAdmin;
  sections: DashboardPageSection[];
};

const statusClass: Record<VisitorApprovalStatus, string> = {
  pending: "bg-amber-50 text-warning-700",
  approved: "bg-emerald-50 text-success-700",
  rejected: "bg-rose-50 text-rose-700",
};

export function VisitorsRoute({
  isLoading,
  visitorAdmin,
  sections: _sections,
}: VisitorsRouteProps) {
  const saveVisitorAdminMutation = useSaveVisitorAdminMutation();
  const approvals = visitorAdmin?.approvals ?? [];
  const buildingConfigs = visitorAdmin?.buildingConfigs ?? [];
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedBuildingCode, setSelectedBuildingCode] = useState<string>(
    buildingConfigs[0]?.buildingCode ?? "",
  );
  const [selectedVisitDate, setSelectedVisitDate] = useState(
    approvals[0]?.visitDate ?? "",
  );
  const [selectedCalendarApprovalId, setSelectedCalendarApprovalId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!selectedBuildingCode && buildingConfigs[0]?.buildingCode) {
      setSelectedBuildingCode(buildingConfigs[0].buildingCode);
    }
  }, [buildingConfigs, selectedBuildingCode]);

  useEffect(() => {
    if (!selectedVisitDate && approvals[0]?.visitDate) {
      setSelectedVisitDate(approvals[0].visitDate);
    }
  }, [approvals, selectedVisitDate]);

  const selectedApproval = selectedApprovalId
    ? approvals.find((item) => item.id === selectedApprovalId) ?? null
    : null;
  const selectedBuildingConfig =
    buildingConfigs.find((item) => item.buildingCode === selectedBuildingCode) ??
    buildingConfigs[0];

  const quotaByBuilding = useMemo(
    () =>
      buildingConfigs.map((config) => {
        const usedSlots = approvals
          .filter(
            (approval) =>
              approval.buildingCode === config.buildingCode &&
              approval.status === "approved",
          )
          .reduce((count, approval) => count + approval.parkingSlotsRequested, 0);

        return {
          ...config,
          usedSlots,
          slotsLeft: Math.max(0, config.totalSlots - usedSlots),
        };
      }),
    [approvals, buildingConfigs],
  );

  const quotaByBuildingAndDate = useMemo(
    () =>
      buildingConfigs.flatMap((config) => {
        const dates = Array.from(
          new Set(
            approvals
              .filter((approval) => approval.buildingCode === config.buildingCode)
              .map((approval) => approval.visitDate),
          ),
        );

        return dates.map((visitDate) => {
          const usedSlots = approvals
            .filter(
              (approval) =>
                approval.buildingCode === config.buildingCode &&
                approval.visitDate === visitDate &&
                approval.status === "approved",
            )
            .reduce((count, approval) => count + approval.parkingSlotsRequested, 0);

          return {
            ...config,
            visitDate,
            usedSlots,
            slotsLeft: Math.max(0, config.totalSlots - usedSlots),
          };
        });
      }),
    [approvals, buildingConfigs],
  );

  const selectedBuildingQuota =
    quotaByBuilding.find((item) => item.buildingCode === selectedBuildingCode) ??
    quotaByBuilding[0];
  const selectedDateQuota = quotaByBuildingAndDate.find(
    (item) =>
      item.buildingCode === selectedBuildingCode &&
      item.visitDate === selectedVisitDate,
  );
  const selectedDateSchedule = approvals.filter(
    (approval) =>
      approval.buildingCode === selectedBuildingCode &&
      approval.visitDate === selectedVisitDate &&
      approval.status === "approved",
  );
  const selectedCalendarApproval =
    approvals.find((approval) => approval.id === selectedCalendarApprovalId) ?? null;
  const calendarEvents = useMemo(
    () =>
      approvals
        .filter(
          (approval) =>
            approval.buildingCode === selectedBuildingCode &&
            approval.status === "approved",
        )
        .map((approval) => ({
          id: approval.id,
          title: `${approval.visitorName} • ${approval.unitCode}`,
          start: approval.visitDate,
          allDay: true,
          extendedProps: {
            approval,
          },
          classNames: [approval.status],
        })),
    [approvals, selectedBuildingCode],
  );

  function persistWorkspace(
    nextApprovals: VisitorApproval[],
    nextBuildingConfigs: VisitorParkingQuotaConfig[] = buildingConfigs,
  ) {
    saveVisitorAdminMutation.mutate({
      approvals: nextApprovals,
      buildingConfigs: nextBuildingConfigs,
    });
  }

  function updateApprovalStatus(
    approvalId: string,
    nextStatus: VisitorApprovalStatus,
  ) {
    const approval = approvals.find((item) => item.id === approvalId);

    if (!approval) {
      return;
    }

    const dateQuota = quotaByBuildingAndDate.find(
      (item) =>
        item.buildingCode === approval.buildingCode &&
        item.visitDate === approval.visitDate,
    );
    const wouldUseSlots =
      nextStatus === "approved" ? approval.parkingSlotsRequested : 0;

    if (
      nextStatus === "approved" &&
      dateQuota &&
      dateQuota.slotsLeft < wouldUseSlots &&
      approval.status !== "approved"
    ) {
      return;
    }

    setSelectedBuildingCode(approval.buildingCode);
    setSelectedVisitDate(approval.visitDate);

    persistWorkspace(
      approvals.map((item) =>
        item.id === approvalId ? { ...item, status: nextStatus } : item,
      ),
    );
  }

  function updateQuota(buildingCode: string, totalSlots: number) {
    persistWorkspace(
      approvals,
      buildingConfigs.map((config) =>
        config.buildingCode === buildingCode ? { ...config, totalSlots } : config,
      ),
    );
  }

  return (
    <>
      {selectedCalendarApproval ? (
        <VisitorEventModal
          approval={selectedCalendarApproval}
          quota={quotaByBuildingAndDate.find(
            (item) =>
              item.buildingCode === selectedCalendarApproval.buildingCode &&
              item.visitDate === selectedCalendarApproval.visitDate,
          )}
          onClose={() => setSelectedCalendarApprovalId(null)}
          onApprove={() => {
            updateApprovalStatus(selectedCalendarApproval.id, "approved");
            setSelectedCalendarApprovalId(null);
          }}
          onReject={() => {
            updateApprovalStatus(selectedCalendarApproval.id, "rejected");
            setSelectedCalendarApprovalId(null);
          }}
        />
      ) : null}

      {selectedApproval ? (
        <DashboardModal
          title="Visitor Review"
          description="Approve the request only if host details and parking capacity are valid for the target building and visit date."
          onClose={() => setSelectedApprovalId(null)}
        >
          <VisitorApprovalDetail
            approval={selectedApproval}
            quota={quotaByBuildingAndDate.find(
              (item) =>
                item.buildingCode === selectedApproval.buildingCode &&
                item.visitDate === selectedApproval.visitDate,
            )}
            onApprove={() => updateApprovalStatus(selectedApproval.id, "approved")}
            onReject={() => updateApprovalStatus(selectedApproval.id, "rejected")}
          />
        </DashboardModal>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="Pending Requests"
          value={approvals.filter((item) => item.status === "pending").length}
          tone="warning"
          hint="Visitor approvals still waiting for host or parking review."
        />
        <DashboardStatCard
          label="Approved Requests"
          value={approvals.filter((item) => item.status === "approved").length}
          tone="success"
          hint="Guest entries already cleared for access and guard-house handling."
        />
        <DashboardStatCard
          label="Total Buildings"
          value={buildingConfigs.length}
          tone="brand"
          hint="Buildings currently using the shared visitor access workflow."
        />
        <DashboardStatCard
          label="Slots Left"
          value={quotaByBuilding.reduce((count, item) => count + item.slotsLeft, 0)}
          tone="neutral"
          hint="Combined remaining visitor parking capacity across the portfolio."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title={visitorAdmin?.title ?? "Visitor Approval Queue"}
          description={visitorAdmin?.description ?? ""}
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <VisitorQueueSkeleton key={index} />
                ))
              : approvals.map((approval) => {
                  const quota = quotaByBuildingAndDate.find(
                    (item) => item.buildingCode === approval.buildingCode,
                  ) && approval.visitDate
                    ? quotaByBuildingAndDate.find(
                        (item) =>
                          item.buildingCode === approval.buildingCode &&
                          item.visitDate === approval.visitDate,
                      )
                    : undefined;
                  const blockedByQuota =
                    approval.status !== "approved" &&
                    (quota?.slotsLeft ?? selectedBuildingQuota?.totalSlots ?? 0) <
                      approval.parkingSlotsRequested;

                  return (
                    <button
                      key={approval.id}
                      type="button"
                      onClick={() => {
                        setSelectedApprovalId(approval.id);
                        setSelectedBuildingCode(approval.buildingCode);
                        setSelectedVisitDate(approval.visitDate);
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        approval.id === selectedApprovalId
                          ? "border-brand-900 bg-brand-100/40 shadow-card"
                          : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-900">
                            {approval.visitorName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                            Host {approval.hostName} • {approval.unitCode}
                          </p>
                        </div>
                        <span
                          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClass[approval.status]}`}
                        >
                          {approval.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-ink-500">
                        {approval.buildingName} • {approval.visitDate} • {approval.arrivalWindow}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                        {approval.parkingSlotsRequested} parking slot
                        {approval.parkingSlotsRequested > 1 ? "s" : ""} requested
                        {blockedByQuota ? " • quota exceeded for date" : ""}
                      </p>
                    </button>
                  );
                })}
          </div>
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title={visitorAdmin?.helperTitle ?? "Building Parking Config"}
            description={visitorAdmin?.helperDescription ?? ""}
          >
            {isLoading || !selectedBuildingQuota || !selectedBuildingConfig ? (
              <VisitorConfigSkeleton />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedBuildingCode}
                    onChange={(event) => setSelectedBuildingCode(event.target.value)}
                    className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
                  >
                    {buildingConfigs.map((config) => (
                      <option key={config.buildingCode} value={config.buildingCode}>
                        {config.buildingName}
                      </option>
                    ))}
                  </select>
                  <span className="rounded-pill bg-canvas-50 px-3 py-2 text-sm font-semibold text-ink-700">
                    {selectedBuildingQuota.slotsLeft} left / {selectedBuildingQuota.totalSlots} total
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <QuotaCard label="Total Slots" value={selectedBuildingQuota.totalSlots} />
                  <QuotaCard label="Used Slots" value={selectedBuildingQuota.usedSlots} />
                  <QuotaCard label="Slots Left" value={selectedBuildingQuota.slotsLeft} />
                </div>

                <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                    Selected date quota
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-900">
                    {selectedVisitDate || "Pick a date from the calendar"}
                  </p>
                  <p className="mt-2 text-sm text-ink-600">
                    {selectedDateQuota
                      ? `${selectedDateQuota.slotsLeft} left out of ${selectedDateQuota.totalSlots} slots on this date`
                      : `No approved parking usage yet for this date. Full quota of ${selectedBuildingQuota.totalSlots} slots is available.`}
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                    Set building quota
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={selectedBuildingConfig.totalSlots}
                    onChange={(event) =>
                      updateQuota(
                        selectedBuildingConfig.buildingCode,
                        Number.parseInt(event.target.value || "0", 10),
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-brand-900"
                  />
                </label>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Visitor Calendar"
            description="Review the daily schedule, parking load, and approved visitor usage by date."
          >
            {isLoading ? (
              <VisitorConfigSkeleton />
            ) : (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-lg border border-border-100 bg-white p-3 calendar-shell">
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "",
                    }}
                    height="auto"
                    events={calendarEvents}
                    eventClick={(info) => {
                      const approval = info.event.extendedProps.approval as VisitorApproval;
                      setSelectedVisitDate(approval.visitDate);
                      setSelectedBuildingCode(approval.buildingCode);
                      setSelectedApprovalId(approval.id);
                      setSelectedCalendarApprovalId(approval.id);
                    }}
                    dateClick={(info) => {
                      setSelectedVisitDate(info.dateStr);
                    }}
                  />
                </div>

                <div className="rounded-lg border border-border-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                        Schedule for {selectedVisitDate || "selected date"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-brand-900">
                        {selectedBuildingConfig?.buildingName ?? "Select a building"}
                      </p>
                    </div>
                    {selectedDateQuota ? (
                      <span className="rounded-pill bg-canvas-50 px-3 py-2 text-sm font-semibold text-ink-700">
                        {selectedDateQuota.slotsLeft} left / {selectedDateQuota.totalSlots}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedDateSchedule.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-4 text-sm text-ink-500">
                        No scheduled visitors for this building and date.
                      </div>
                    ) : (
                      selectedDateSchedule.map((approval) => (
                        <div
                          key={approval.id}
                          className="rounded-lg border border-border-100 bg-canvas-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {approval.visitorName}
                              </p>
                              <p className="mt-1 text-sm text-ink-500">
                                {approval.arrivalWindow} • Host {approval.hostName}
                              </p>
                            </div>
                            <span
                              className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClass[approval.status]}`}
                            >
                              {approval.status}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-500">
                            {approval.parkingSlotsRequested} slot
                            {approval.parkingSlotsRequested === 1 ? "" : "s"} • {approval.vehiclePlate}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Building Totals"
            description="A cross-date overview of approved parking usage by building."
          >
            {isLoading ? (
              <VisitorConfigSkeleton />
            ) : (
              <div className="space-y-3">
                {quotaByBuilding.map((quota) => (
                  <div
                    key={quota.buildingCode}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-100 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-900">{quota.buildingName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                        {quota.totalSlots} configured slots
                      </p>
                    </div>
                    <span className="rounded-pill bg-canvas-50 px-3 py-2 text-sm font-semibold text-ink-700">
                      {quota.usedSlots} used • {quota.slotsLeft} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>

        </div>
      </section>
    </>
  );
}

function VisitorApprovalDetail({
  approval,
  quota,
  onApprove,
  onReject,
}: {
  approval: VisitorApproval;
  quota?: { slotsLeft: number; totalSlots: number; usedSlots: number };
  onApprove: () => void;
  onReject: () => void;
}) {
  const blockedByQuota =
    approval.status !== "approved" &&
    (quota?.slotsLeft ?? 0) < approval.parkingSlotsRequested;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Visitor Request</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {approval.visitorName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Host {approval.hostName} • {approval.unitCode} • {approval.buildingName}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClass[approval.status]}`}
        >
          {approval.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuotaDetail label="Resident Code" value={approval.residentCode || "No resident code"} />
        <QuotaDetail label="Vehicle Plate" value={approval.vehiclePlate} />
        <QuotaDetail label="Visit Date" value={approval.visitDate} />
        <QuotaDetail label="Arrival Window" value={approval.arrivalWindow} />
        <QuotaDetail
          label="Parking Request"
          value={`${approval.parkingSlotsRequested} slot${approval.parkingSlotsRequested > 1 ? "s" : ""}`}
        />
        <QuotaDetail
          label="Quota Left"
          value={
            quota ? `${quota.slotsLeft} of ${quota.totalSlots} slots left` : "No config"
          }
        />
      </div>

      <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Visit Purpose</p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{approval.purpose}</p>
      </div>

      {blockedByQuota ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          This request needs {approval.parkingSlotsRequested} parking slot
          {approval.parkingSlotsRequested > 1 ? "s" : ""}, but the building only has{" "}
          {quota?.slotsLeft ?? 0} left.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={blockedByQuota}
          className="inline-flex rounded-pill border border-emerald-700 bg-emerald-50 px-4 py-2 text-sm font-semibold text-success-700 disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
        >
          Approve Visitor
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

function QuotaCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-brand-900">{value}</p>
    </div>
  );
}

function QuotaDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function VisitorQueueSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function VisitorConfigSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-pill bg-surface-100" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg bg-canvas-50 p-6" />
        ))}
      </div>
    </div>
  );
}


function VisitorEventModal({
  approval,
  quota,
  onClose,
  onApprove,
  onReject,
}: {
  approval: VisitorApproval;
  quota?: { slotsLeft: number; totalSlots: number; usedSlots: number };
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border-100 bg-white p-6 shadow-floating">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Visitor Event</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
              {approval.visitorName}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {approval.visitDate} • {approval.arrivalWindow} • {approval.buildingName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6">
          <VisitorApprovalDetail
            approval={approval}
            quota={quota}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      </div>
    </div>
  );
}
