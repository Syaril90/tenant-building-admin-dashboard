import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useUpdateDocumentRequestMutation } from "../queries/use-update-document-request-mutation";
import type {
  DashboardPageSection,
  DocumentRequestAttachment,
  DocumentRequestStatus,
  DocumentsAdmin,
} from "../types";

type DocumentRequestsRouteProps = {
  isLoading: boolean;
  documentsAdmin?: DocumentsAdmin;
  sections: DashboardPageSection[];
};

const requestStatusClass: Record<DocumentRequestStatus, string> = {
  submitted: "bg-amber-50 text-warning-700",
  in_review: "bg-sky-50 text-sky-700",
  fulfilled: "bg-emerald-50 text-success-700",
  rejected: "bg-rose-50 text-rose-700",
};

export function DocumentRequestsRoute({
  isLoading,
  documentsAdmin,
  sections: _sections,
}: DocumentRequestsRouteProps) {
  const updateDocumentRequestMutation = useUpdateDocumentRequestMutation();
  const requests = documentsAdmin?.requests ?? [];
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestQuery, setRequestQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<"all" | DocumentRequestStatus>(
    "all"
  );
  const [requestReviewForm, setRequestReviewForm] = useState({
    status: "submitted" as DocumentRequestStatus,
    comment: "",
    attachment: null as File | null,
    attachmentName: "",
  });

  const filteredRequests = useMemo(() => {
    const normalized = requestQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        requestStatusFilter === "all" ? true : request.status === requestStatusFilter;
      const matchesQuery = normalized
        ? [
            request.reference,
            request.residentName,
            request.residentCode,
            request.unitCode,
            request.buildingName,
            request.requestTypeLabel,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        : true;

      return matchesStatus && matchesQuery;
    });
  }, [requestQuery, requestStatusFilter, requests]);

  const selectedRequest = selectedRequestId
    ? requests.find((request) => request.id === selectedRequestId) ?? null
    : null;
  const residentAttachments = (selectedRequest?.attachments ?? []).filter(
    (attachment) => attachment.uploadedBy === "resident"
  );
  const adminAttachments = (selectedRequest?.attachments ?? []).filter(
    (attachment) => attachment.uploadedBy === "admin"
  );

  useEffect(() => {
    if (selectedRequest) {
      setRequestReviewForm({
        status: selectedRequest.status,
        comment: selectedRequest.latestComment,
        attachment: null,
        attachmentName: "",
      });
    }
  }, [selectedRequest]);

  function handleRequestAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setRequestReviewForm((current) => ({
      ...current,
      attachment: file,
      attachmentName: file?.name ?? "",
    }));
    event.target.value = "";
  }

  function updateRequest() {
    if (!selectedRequest || !requestReviewForm.comment.trim()) {
      return;
    }

    updateDocumentRequestMutation.mutate(
      {
        requestId: selectedRequest.id,
        status: requestReviewForm.status,
        comment: requestReviewForm.comment.trim(),
        attachment: requestReviewForm.attachment,
      },
      {
        onSuccess: () => {
          setRequestReviewForm((current) => ({
            ...current,
            attachment: null,
            attachmentName: "",
          }));
        },
      }
    );
  }

  const requestStats = useMemo(
    () => ({
      total: requests.length,
      submitted: requests.filter((request) => request.status === "submitted").length,
      inReview: requests.filter((request) => request.status === "in_review").length,
      fulfilled: requests.filter((request) => request.status === "fulfilled").length,
    }),
    [requests]
  );

  return (
    <>
      {selectedRequest ? (
        <DashboardModal
          title={documentsAdmin?.helperTitle ?? "Document Request Review"}
          description={
            documentsAdmin?.helperDescription ??
            "Review request details, attach prepared files, and move the request through its next status."
          }
          onClose={() => setSelectedRequestId(null)}
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${requestStatusClass[selectedRequest.status]}`}
              >
                {formatRequestStatusLabel(selectedRequest.status)}
              </span>
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                {selectedRequest.reference} • {selectedRequest.submittedAt}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetaCard label="Resident" value={selectedRequest.residentName} />
              <MetaCard label="Resident Code" value={selectedRequest.residentCode} />
              <MetaCard label="Unit" value={selectedRequest.unitCode} />
              <MetaCard label="Building" value={selectedRequest.buildingName} />
              <MetaCard label="Requested Document" value={selectedRequest.requestTypeLabel} />
              <MetaCard label="Preferred Format" value={selectedRequest.preferredFormatLabel} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ContentCard title="Purpose" body={selectedRequest.purpose} />
              <ContentCard title="Resident Notes" body={selectedRequest.notes || "No notes provided."} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AttachmentListCard
                title="Resident Attachments"
                emptyLabel="No supporting files uploaded by the resident."
                attachments={residentAttachments}
              />
              <AttachmentListCard
                title="Management Attachments"
                emptyLabel="No prepared files attached by management yet."
                attachments={adminAttachments}
              />
            </div>

            <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Timeline</p>
              <div className="mt-4 space-y-3">
                {selectedRequest.timeline.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      item.isCurrent ? "border-brand-900 bg-white" : "border-border-100 bg-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                        {item.timestamp}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border-100 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-brand-900">Update Request</p>
                <p className="mt-1 text-sm text-ink-500">
                  Leave a visible comment for the audit trail and optionally attach the prepared file.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Status</span>
                  <select
                    value={requestReviewForm.status}
                    onChange={(event) =>
                      setRequestReviewForm((current) => ({
                        ...current,
                        status: event.target.value as DocumentRequestStatus,
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In Review</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Attachment</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleRequestAttachmentSelection}
                    className="mt-2 block w-full text-sm text-ink-700 file:mr-4 file:rounded-pill file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <p className="mt-2 text-xs text-ink-500">
                    {requestReviewForm.attachmentName || "No file selected"}
                  </p>
                </label>
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Review Comment</span>
                <textarea
                  value={requestReviewForm.comment}
                  onChange={(event) =>
                    setRequestReviewForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={updateRequest}
                  disabled={
                    updateDocumentRequestMutation.isPending || !requestReviewForm.comment.trim()
                  }
                  className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
                >
                  {updateDocumentRequestMutation.isPending ? "Saving..." : "Save Request Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequestId(null)}
                  className="inline-flex rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </DashboardModal>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="Total Requests"
          value={requestStats.total}
          tone="brand"
          hint="All resident document requests currently visible to management."
        />
        <DashboardStatCard
          label="Submitted"
          value={requestStats.submitted}
          tone="warning"
          hint="New requests waiting to be acknowledged or reviewed."
        />
        <DashboardStatCard
          label="In Review"
          value={requestStats.inReview}
          tone="progress"
          hint="Requests currently being prepared or validated by the office."
        />
        <DashboardStatCard
          label="Fulfilled"
          value={requestStats.fulfilled}
          tone="success"
          hint="Requests completed with a final file or handover outcome."
        />
      </section>

      <section>
        <DashboardPanel
          title="Resident Document Requests"
          description="Monitor inbound resident requests, review supporting files, and keep the request trail updated with comments and delivered attachments."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <a
                href="#/documents"
                className="inline-flex rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
              >
                Open Document Library
              </a>
              <input
                value={requestQuery}
                onChange={(event) => setRequestQuery(event.target.value)}
                placeholder="Search request, resident, reference, or unit"
                className="min-w-[240px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={requestStatusFilter}
                onChange={(event) =>
                  setRequestStatusFilter(event.target.value as "all" | DocumentRequestStatus)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            ) : null}

            <div className="space-y-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <RequestQueueSkeleton key={index} />
                  ))
                : filteredRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedRequestId(request.id)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        request.id === selectedRequestId
                          ? "border-brand-900 bg-brand-100/40 shadow-card"
                          : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-900">{request.requestTypeLabel}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                            {request.reference} • {request.unitCode}
                          </p>
                        </div>
                        <span
                          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${requestStatusClass[request.status]}`}
                        >
                          {formatRequestStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-ink-500">
                        {request.residentName} • {request.buildingName}
                      </p>
                      <p className="mt-1 text-sm text-ink-700 line-clamp-2">{request.purpose}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-500">
                        {request.updatedAt}
                      </p>
                    </button>
                  ))}
              {!isLoading && filteredRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-5 text-sm text-ink-500">
                  No document requests match the current filter set.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function ContentCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-700">{body}</p>
    </div>
  );
}

function AttachmentListCard({
  title,
  emptyLabel,
  attachments,
}: {
  title: string;
  emptyLabel: string;
  attachments: DocumentRequestAttachment[];
}) {
  return (
    <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{title}</p>
      <div className="mt-3 space-y-3">
        {attachments.length === 0 ? (
          <p className="text-sm text-ink-500">{emptyLabel}</p>
        ) : (
          attachments.map((attachment) => (
            <div key={attachment.id} className="rounded-xl border border-border-100 bg-white p-3">
              <p className="text-sm font-semibold text-brand-900">{attachment.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                {attachment.meta}
              </p>
              {attachment.fileUrl ? (
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-pill border border-brand-900 px-3 py-2 text-xs font-semibold text-brand-900"
                >
                  Open File
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RequestQueueSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <div className="h-4 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function formatRequestStatusLabel(status: DocumentRequestStatus) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "fulfilled":
      return "Fulfilled";
    case "rejected":
      return "Rejected";
    default:
      return "Submitted";
  }
}
