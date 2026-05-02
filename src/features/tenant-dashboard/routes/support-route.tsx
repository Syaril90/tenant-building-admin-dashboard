import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useUpdateComplaintStatusMutation } from "../queries/use-update-complaint-status-mutation";
import type {
  ComplaintAttachment,
  ComplaintCase,
  ComplaintStatus,
  DashboardPageSection,
  SupportAdmin,
} from "../types";

type SupportRouteProps = {
  isLoading: boolean;
  supportAdmin?: SupportAdmin;
  sections: DashboardPageSection[];
};

const statusClass: Record<ComplaintStatus, string> = {
  received: "bg-amber-50 text-warning-700",
  in_progress: "bg-sky-50 text-sky-700",
  done: "bg-emerald-50 text-success-700",
};

export function SupportRoute({
  isLoading,
  supportAdmin,
  sections: _sections,
}: SupportRouteProps) {
  const updateComplaintStatusMutation = useUpdateComplaintStatusMutation();
  const complaints = supportAdmin?.complaints ?? [];
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | ComplaintCase["priority"]>(
    "all",
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<{
    title: string;
    imageUrl: string;
  } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ComplaintStatus>("received");
  const [statusComment, setStatusComment] = useState("");

  const filteredComplaints = useMemo(
    () => {
      const query = searchValue.trim().toLowerCase();

      return complaints.filter((complaint) => {
        const matchesStatus =
          statusFilter === "all" ? true : complaint.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" ? true : complaint.priority === priorityFilter;
        const matchesSearch =
          query.length === 0
            ? true
            : [
                complaint.title,
                complaint.residentName,
                complaint.unitCode,
                complaint.buildingName,
                complaint.category,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

        return matchesStatus && matchesPriority && matchesSearch;
      });
    },
    [complaints, priorityFilter, searchValue, statusFilter],
  );

  const selectedComplaint = selectedComplaintId
    ? filteredComplaints.find((complaint) => complaint.id === selectedComplaintId) ?? null
    : null;
  const selectedComplaintPreviews = selectedComplaint?.previews ?? [];
  const selectedComplaintAttachments = selectedComplaint?.attachments ?? [];
  const selectedComplaintTimeline = selectedComplaint?.timeline ?? [];

  useEffect(() => {
    if (
      selectedComplaintId &&
      !filteredComplaints.some((complaint) => complaint.id === selectedComplaintId)
    ) {
      setSelectedComplaintId(null);
    }
  }, [filteredComplaints, selectedComplaintId]);

  useEffect(() => {
    if (selectedComplaint) {
      setPendingStatus(selectedComplaint.status);
      setStatusComment("");
    }
  }, [selectedComplaint]);

  const complaintStats = useMemo(
    () => ({
      received: complaints.filter((complaint) => complaint.status === "received").length,
      progress: complaints.filter((complaint) => complaint.status === "in_progress").length,
      done: complaints.filter((complaint) => complaint.status === "done").length,
      total: complaints.length,
    }),
    [complaints],
  );

  function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
    updateComplaintStatusMutation.mutate({
      complaintId,
      status,
      comment: statusComment.trim(),
    });
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="Total Cases"
          value={complaintStats.total}
          tone="warning"
          hint="All complaint records currently visible in the operations queue."
        />
        <DashboardStatCard
          label="Received"
          value={complaintStats.received}
          tone="brand"
          hint="New complaints waiting for the management team to start action."
        />
        <DashboardStatCard
          label="In Progress"
          value={complaintStats.progress}
          tone="progress"
          hint="Live service work currently moving through field resolution."
        />
        <DashboardStatCard
          label="Done"
          value={complaintStats.done}
          tone="success"
          hint="Complaints marked completed and shown as done to the resident."
        />
      </section>

      {selectedComplaint ? (
        <DashboardModal
          title={supportAdmin?.helperTitle ?? "Complaint Status"}
          description={
            supportAdmin?.helperDescription ??
            "Review resident evidence and update the complaint status."
          }
          onClose={() => setSelectedComplaintId(null)}
        >
          <ComplaintDetailContent
            selectedComplaint={selectedComplaint}
            selectedComplaintPreviews={selectedComplaintPreviews}
            selectedComplaintAttachments={selectedComplaintAttachments}
            selectedComplaintTimeline={selectedComplaintTimeline}
            onOpenPreview={(title, imageUrl) => setSelectedPreview({ title, imageUrl })}
            onUpdateComplaintStatus={updateComplaintStatus}
            pendingStatus={pendingStatus}
            statusComment={statusComment}
            onPendingStatusChange={setPendingStatus}
            onStatusCommentChange={setStatusComment}
            isUpdating={updateComplaintStatusMutation.isPending}
          />
        </DashboardModal>
      ) : null}

      <section>
        <DashboardPanel
          title={supportAdmin?.title ?? "Complaint Operations"}
          description={supportAdmin?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search complaint, resident, unit, or category"
                className="min-w-[240px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | ComplaintStatus)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All statuses</option>
                <option value="received">Received</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value as "all" | ComplaintCase["priority"],
                  )
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredComplaints.length} of {complaints.length} complaints
              </p>
            ) : null}

            <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <ComplaintQueueSkeleton key={index} />
                ))
              : filteredComplaints.map((complaint) => (
                  <button
                    key={complaint.id}
                    type="button"
                    onClick={() => setSelectedComplaintId(complaint.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      complaint.id === selectedComplaintId
                        ? "border-brand-900 bg-brand-100/40 shadow-card"
                        : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-900">{complaint.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                          {complaint.category} • {complaint.unitCode}
                        </p>
                      </div>
                      <span
                        className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClass[complaint.status]}`}
                      >
                        {formatStatusLabel(complaint.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-ink-500">
                      {complaint.residentName} • {complaint.buildingName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                      {complaint.priority} priority • {complaint.submittedAt}
                    </p>
                  </button>
                ))}
              {!isLoading && filteredComplaints.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-5 text-sm text-ink-500">
                  No complaints match the current filter set.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      </section>
      {selectedPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-6">
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setSelectedPreview(null)}
            className="absolute inset-0"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                  Resident uploaded image
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPreview.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="rounded-pill border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <img
              src={selectedPreview.imageUrl}
              alt={selectedPreview.title}
              className="max-h-[78vh] w-full object-contain bg-ink-900"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ComplaintDetailContent({
  selectedComplaint,
  selectedComplaintPreviews,
  selectedComplaintAttachments,
  selectedComplaintTimeline,
  onOpenPreview,
  onUpdateComplaintStatus,
  pendingStatus,
  statusComment,
  onPendingStatusChange,
  onStatusCommentChange,
  isUpdating,
}: {
  selectedComplaint: ComplaintCase;
  selectedComplaintPreviews: ComplaintCase["previews"];
  selectedComplaintAttachments: ComplaintCase["attachments"];
  selectedComplaintTimeline: ComplaintCase["timeline"];
  onOpenPreview: (title: string, imageUrl: string) => void;
  onUpdateComplaintStatus: (complaintId: string, status: ComplaintStatus) => void;
  pendingStatus: ComplaintStatus;
  statusComment: string;
  onPendingStatusChange: (status: ComplaintStatus) => void;
  onStatusCommentChange: (comment: string) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
            {selectedComplaint.eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {selectedComplaint.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {selectedComplaint.residentName} • {selectedComplaint.unitCode} •{" "}
            {selectedComplaint.buildingName}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClass[selectedComplaint.status]}`}
        >
          {formatStatusLabel(selectedComplaint.status)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SupportDetailBlock label="Reference" value={selectedComplaint.reference} />
        <SupportDetailBlock label="Resident Code" value={selectedComplaint.residentCode} />
        <SupportDetailBlock label="Submitted At" value={selectedComplaint.submittedAt} />
        <SupportDetailBlock label="Updated At" value={selectedComplaint.updatedAt} />
        <SupportDetailBlock label="Category" value={selectedComplaint.category} />
        <SupportDetailBlock label="Priority" value={selectedComplaint.priority} />
        <SupportDetailBlock label="Reported On" value={selectedComplaint.reportDateLabel} />
        <SupportDetailBlock label="Location" value={selectedComplaint.location} />
      </div>

      <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedComplaint.summaryTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          {selectedComplaint.summaryBody}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
            Resident Uploaded Images
          </p>
          <p className="text-xs text-ink-500">
            {selectedComplaintPreviews.length} image
            {selectedComplaintPreviews.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {selectedComplaintPreviews.map((preview, index) => (
            <button
              key={preview.id}
              type="button"
              onClick={() =>
                onOpenPreview(`${selectedComplaint.title} image ${index + 1}`, preview.imageUrl)
              }
              className="group overflow-hidden rounded-xl border border-border-100 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-900/20"
            >
              <img
                src={preview.imageUrl}
                alt={`${selectedComplaint.title} preview ${index + 1}`}
                className="h-40 w-full object-cover transition group-hover:scale-[1.02]"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Photo {index + 1}</p>
                  <p className="text-xs text-ink-500">Tap to enlarge</p>
                </div>
                <span className="rounded-pill bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-900">
                  Image
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedComplaint.attachmentsTitle}
        </p>
        <div className="mt-3 space-y-3">
          {selectedComplaintAttachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.fileUrl || undefined}
              target={attachment.fileUrl ? "_blank" : undefined}
              rel={attachment.fileUrl ? "noreferrer" : undefined}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-100 bg-canvas-50 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-900">{attachment.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                  {attachment.meta}
                </p>
              </div>
              <span className="rounded-pill bg-surface-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                {formatAttachmentType(attachment.type)}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedComplaint.timelineTitle}
        </p>
        <div className="mt-4 space-y-4">
          {selectedComplaintTimeline.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 h-3 w-3 rounded-full ${
                    item.isCurrent ? "bg-brand-900" : "bg-border-100"
                  }`}
                />
                <span className="mt-2 h-full w-px bg-border-100 last:hidden" />
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                  {item.isCurrent ? (
                    <span className="rounded-pill bg-brand-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-900">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-500">{item.description}</p>
                {item.timestamp ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                    {item.timestamp}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
            Update Status
          </span>
          <select
            value={pendingStatus}
            onChange={(event) =>
              onPendingStatusChange(event.target.value as ComplaintStatus)
            }
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
          >
            <option value="received">Received</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
            Comment For Resident
          </span>
          <textarea
            value={statusComment}
            onChange={(event) => onStatusCommentChange(event.target.value)}
            rows={4}
            placeholder="Explain what changed so the resident can see the update clearly."
            className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-brand-900"
          />
        </label>
        <button
          type="button"
          disabled={isUpdating || statusComment.trim().length === 0}
          onClick={() => onUpdateComplaintStatus(selectedComplaint.id, pendingStatus)}
          className="rounded-pill bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-300"
        >
          {isUpdating ? "Saving Update..." : "Save Status Update"}
        </button>
      </div>

      <div className="rounded-lg border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Latest Update</p>
        <p className="mt-2 text-sm font-semibold text-brand-900">
          {selectedComplaint.latestUpdate}
        </p>
      </div>
    </div>
  );
}

function SupportDetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function formatStatusLabel(status: ComplaintStatus) {
  return status.replace("_", " ");
}

function formatAttachmentType(type: ComplaintAttachment["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ComplaintQueueSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-28 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}
