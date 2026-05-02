import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import { useCreateAnnouncementAdminMutation } from "../queries/use-create-announcement-admin-mutation";
import type {
  AnnouncementAdmin,
  AnnouncementAttachment,
  AnnouncementItem,
  AnnouncementBadgeTone,
  DashboardPageSection,
} from "../types";

type AnnouncementsRouteProps = {
  isLoading: boolean;
  announcementAdmin?: AnnouncementAdmin;
  sections: DashboardPageSection[];
};

const badgeClass: Record<AnnouncementBadgeTone, string> = {
  danger: "bg-amber-50 text-warning-700",
  brand: "bg-brand-100 text-brand-900",
};

export function AnnouncementsRoute({
  isLoading,
  announcementAdmin,
  sections: _sections,
}: AnnouncementsRouteProps) {
  const createAnnouncementMutation = useCreateAnnouncementAdminMutation();
  const announcements = announcementAdmin?.items ?? [];
  const [searchValue, setSearchValue] = useState("");
  const [toneFilter, setToneFilter] = useState<"all" | AnnouncementBadgeTone>("all");
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    badgeTone: "brand" as AnnouncementBadgeTone,
    affectedArea: "",
    effectiveAt: "",
    contact: "",
    imageUri: "",
    imageName: "",
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<{
    title: string;
    imageUri: string;
  } | null>(null);

  const filteredAnnouncements = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const matchesTone =
        toneFilter === "all" ? true : announcement.badgeTone === toneFilter;
      const matchesQuery =
        query.length === 0
          ? true
          : [
              announcement.title,
              announcement.description,
              announcement.badge,
              announcement.publishedAt,
              announcement.affectedArea,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

      return matchesTone && matchesQuery;
    });
  }, [announcements, searchValue, toneFilter]);

  const selectedAnnouncement = selectedAnnouncementId
    ? filteredAnnouncements.find(
        (announcement) => announcement.id === selectedAnnouncementId,
      ) ?? null
    : null;

  useEffect(() => {
    if (
      selectedAnnouncementId &&
      !filteredAnnouncements.some(
        (announcement) => announcement.id === selectedAnnouncementId,
      )
    ) {
      setSelectedAnnouncementId(null);
    }
  }, [filteredAnnouncements, selectedAnnouncementId]);

  const stats = useMemo(
    () => ({
      urgent: announcements.filter((announcement) => announcement.badgeTone === "danger")
        .length,
      community: announcements.filter((announcement) => announcement.badgeTone === "brand")
        .length,
      attachments: announcements.reduce(
        (count, announcement) => count + announcement.attachments.length,
        0,
      ),
    }),
    [announcements],
  );

  function createAnnouncement() {
    const title = createForm.title.trim();
    const description = createForm.description.trim();
    const affectedArea = createForm.affectedArea.trim();
    const effectiveAt = createForm.effectiveAt.trim();
    const contact = createForm.contact.trim();

    if (!title || !description || !affectedArea || !effectiveAt || !contact) {
      return;
    }

    createAnnouncementMutation.mutate({
      title,
      description,
      badgeTone: createForm.badgeTone,
      affectedArea,
      effectiveAt,
      contact,
      imageFile: selectedImageFile,
      attachmentFiles: selectedAttachmentFiles,
    });
    setIsCreateModalOpen(false);
    setCreateForm({
      title: "",
      description: "",
      badgeTone: "brand",
      affectedArea: "",
      effectiveAt: "",
      contact: "",
      imageUri: "",
      imageName: "",
    });
    setSelectedImageFile(null);
    setSelectedAttachmentFiles([]);
  }

  async function handleCreateImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageUri = await readFileAsDataUrl(file);

    setCreateForm((current) => ({
      ...current,
      imageUri,
      imageName: file.name,
    }));
    setSelectedImageFile(file);
    event.target.value = "";
  }

  function handleAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedAttachmentFiles(files);
    event.target.value = "";
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Urgent Notices"
          value={stats.urgent}
          tone="warning"
          hint="High-priority resident notices that need visibility and close monitoring."
        />
        <DashboardStatCard
          label="Community Updates"
          value={stats.community}
          tone="brand"
          hint="General building communications currently active in the notice stream."
        />
        <DashboardStatCard
          label="Published Assets"
          value={stats.attachments}
          tone="neutral"
          hint="Attached files and supporting assets linked across live announcements."
        />
      </section>

      {selectedAnnouncement ? (
        <DashboardModal
          title={announcementAdmin?.helperTitle ?? "Announcement Detail"}
          description={
            announcementAdmin?.helperDescription ??
            "Review the resident-facing content and attachment set."
          }
          onClose={() => setSelectedAnnouncementId(null)}
        >
          <AnnouncementDetailContent
            announcementAdmin={announcementAdmin}
            selectedAnnouncement={selectedAnnouncement}
            onOpenImage={() =>
              setSelectedImage({
                title: selectedAnnouncement.title,
                imageUri: selectedAnnouncement.imageUri,
              })
            }
          />
        </DashboardModal>
      ) : null}

      {isCreateModalOpen ? (
        <DashboardModal
          title="Create Announcement"
          description="Add a new resident-facing announcement and publish it directly into the announcement queue."
          onClose={() => setIsCreateModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Title
                </span>
                <input
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Notice Type
                </span>
                <select
                  value={createForm.badgeTone}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      badgeTone: event.target.value as AnnouncementBadgeTone,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                >
                  <option value="brand">Community update</option>
                  <option value="danger">Urgent maintenance</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Description
              </span>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Affected Area
                </span>
                <input
                  value={createForm.affectedArea}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      affectedArea: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Effective Date & Time
                </span>
                <input
                  type="datetime-local"
                  value={createForm.effectiveAt}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      effectiveAt: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Contact
                </span>
                <input
                  value={createForm.contact}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, contact: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                  Announcement Image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    handleCreateImageSelection(event).catch(() => {
                      event.target.value = "";
                    });
                  }}
                  className="mt-2 block w-full text-sm text-ink-700 file:mr-4 file:rounded-pill file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="mt-2 text-xs text-ink-500">
                  {createForm.imageName || "No image selected"}
                </p>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Attachments
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleAttachmentSelection}
                className="mt-2 block w-full text-sm text-ink-700 file:mr-4 file:rounded-pill file:border-0 file:bg-surface-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink-700"
              />
              <div className="mt-2 space-y-1 text-xs text-ink-500">
                {selectedAttachmentFiles.length > 0
                  ? selectedAttachmentFiles.map((file) => <p key={file.name}>{file.name}</p>)
                  : <p>No attachments selected</p>}
              </div>
            </label>

            {createForm.imageUri ? (
              <div className="overflow-hidden rounded-2xl border border-border-100 bg-canvas-50">
                <img
                  src={createForm.imageUri}
                  alt="Announcement preview"
                  className="h-48 w-full object-cover"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createAnnouncement}
                disabled={
                  createAnnouncementMutation.isPending ||
                  !createForm.title.trim() ||
                  !createForm.description.trim() ||
                  !createForm.affectedArea.trim() ||
                  !createForm.effectiveAt.trim() ||
                  !createForm.contact.trim()
                }
                className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
              >
                {createAnnouncementMutation.isPending ? "Publishing..." : "Publish Announcement"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="inline-flex rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </DashboardModal>
      ) : null}

      <section>
        <DashboardPanel
          title={announcementAdmin?.title ?? "Announcement Operations"}
          description={announcementAdmin?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900"
              >
                Create Announcement
              </button>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search announcements, updates, or affected areas"
                className="min-w-[240px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={toneFilter}
                onChange={(event) =>
                  setToneFilter(event.target.value as "all" | AnnouncementBadgeTone)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All notices</option>
                <option value="danger">Urgent</option>
                <option value="brand">Community</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredAnnouncements.length} of {announcements.length} announcements
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <AnnouncementCardSkeleton key={index} />
                  ))
                : filteredAnnouncements.map((announcement) => (
                    <button
                      key={announcement.id}
                      type="button"
                      onClick={() => setSelectedAnnouncementId(announcement.id)}
                      className={`w-full overflow-hidden rounded-2xl border text-left transition ${
                        announcement.id === selectedAnnouncementId
                          ? "border-brand-900 bg-brand-100/40 shadow-card"
                          : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                      }`}
                    >
                      <img
                        src={announcement.imageUri}
                        alt={announcement.title}
                        className="h-36 w-full object-cover"
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass[announcement.badgeTone]}`}
                          >
                            {announcement.badge}
                          </span>
                          <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                            {announcement.publishedAt}
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-black tracking-[-0.03em] text-brand-900">
                            {announcement.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-ink-500">
                            {announcement.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              {!isLoading && filteredAnnouncements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-100 bg-canvas-50 p-5 text-sm text-ink-500 md:col-span-2">
                  No announcements match the current filter set.
                </div>
              ) : null}
            </div>
          </div>
        </DashboardPanel>
      </section>

      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-6">
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setSelectedImage(null)}
            className="absolute inset-0"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                  Announcement image
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedImage.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-pill border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <img
              src={selectedImage.imageUri}
              alt={selectedImage.title}
              className="max-h-[78vh] w-full object-contain bg-ink-900"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function AnnouncementDetailContent({
  announcementAdmin,
  selectedAnnouncement,
  onOpenImage,
}: {
  announcementAdmin?: AnnouncementAdmin;
  selectedAnnouncement: AnnouncementAdmin["items"][number];
  onOpenImage: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass[selectedAnnouncement.badgeTone]}`}
        >
          {selectedAnnouncement.badge}
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedAnnouncement.publishedAt}
        </span>
      </div>

      <div>
        <h3 className="text-2xl font-black tracking-[-0.03em] text-brand-900">
          {selectedAnnouncement.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          {selectedAnnouncement.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenImage}
        className="overflow-hidden rounded-2xl border border-border-100 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-900/20"
      >
        <img
          src={selectedAnnouncement.imageUri}
          alt={selectedAnnouncement.title}
          className="h-64 w-full object-cover"
        />
      </button>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedAnnouncement.summaryTitle}
        </p>
        {selectedAnnouncement.summaryParagraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-ink-700">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedAnnouncement.highlightedAreaTitle}
        </p>
        <div className="mt-3 space-y-2">
          {selectedAnnouncement.highlightedAreaItems.map((item) => (
            <p key={item} className="text-sm leading-6 text-ink-700">
              • {item}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {selectedAnnouncement.timelineTitle}
        </p>
        {selectedAnnouncement.timelineParagraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-ink-700">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailBlock
          label={announcementAdmin?.labels.category ?? "Category"}
          value={selectedAnnouncement.badge}
        />
        <DetailBlock
          label={announcementAdmin?.labels.publishedAt ?? "Published"}
          value={selectedAnnouncement.publishedAt}
        />
        <DetailBlock
          label={announcementAdmin?.labels.affectedArea ?? "Affected Area"}
          value={selectedAnnouncement.affectedArea}
        />
        <DetailBlock
          label={announcementAdmin?.labels.schedule ?? "Schedule"}
          value={selectedAnnouncement.schedule}
        />
        <DetailBlock
          label={selectedAnnouncement.etaLabel}
          value={selectedAnnouncement.etaValue}
        />
        <DetailBlock
          label={selectedAnnouncement.teamLabel}
          value={selectedAnnouncement.teamValue}
        />
      </div>

      <div className="rounded-2xl border border-border-100 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
          {announcementAdmin?.labels.attachmentsTitle ?? "Attachments"}
        </p>
        <div className="mt-3 space-y-3">
          {selectedAnnouncement.attachments.length > 0 ? (
            selectedAnnouncement.attachments.map((attachment) => (
              <AttachmentRow key={attachment.id} attachment={attachment} />
            ))
          ) : (
            <p className="text-sm text-ink-500">No attachments uploaded for this announcement.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-brand-900 px-5 py-6 text-white">
        <p className="text-lg font-black tracking-[-0.03em]">
          {selectedAnnouncement.supportTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/80">
          {selectedAnnouncement.supportDescription}
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {announcementAdmin?.labels.contact ?? "Contact"}
        </p>
        <p className="mt-1 text-sm font-semibold">{selectedAnnouncement.contact}</p>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-brand-900">{value}</p>
    </div>
  );
}

function AttachmentRow({ attachment }: { attachment: AnnouncementAttachment }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-100 bg-canvas-50 p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-900">{attachment.title}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
          {attachment.meta}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {attachment.fileUrl ? (
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-pill border border-brand-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-900"
          >
            Open
          </a>
        ) : null}
        <span className="rounded-pill bg-surface-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
          {attachment.type.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function AnnouncementCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-100 bg-white">
      <div className="h-36 animate-pulse bg-surface-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-28 animate-pulse rounded-full bg-surface-100" />
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-surface-100" />
        <div className="h-4 w-full animate-pulse rounded-full bg-surface-100" />
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image read failed."));
    };

    reader.onerror = () => {
      reject(new Error("Image read failed."));
    };

    reader.readAsDataURL(file);
  });
}
