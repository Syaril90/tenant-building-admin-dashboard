import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { useCreateDocumentAdminMutation } from "../queries/use-create-document-admin-mutation";
import type {
  DashboardPageSection,
  DocumentFileTone,
  DocumentsAdmin,
  StrataRegistration,
} from "../types";

type DocumentsRouteProps = {
  isLoading: boolean;
  documentsAdmin?: DocumentsAdmin;
  strata?: StrataRegistration;
  sections: DashboardPageSection[];
};

export function DocumentsRoute({
  isLoading,
  documentsAdmin,
  strata,
  sections: _sections,
}: DocumentsRouteProps) {
  const createDocumentAdminMutation = useCreateDocumentAdminMutation();
  const categories = documentsAdmin?.categories ?? [];
  const documents = documentsAdmin?.items ?? [];
  const buildingOptions = useMemo(
    () =>
      (strata?.tree ?? [])
        .filter((node) => node.type === "building")
        .map((node) => ({ code: node.code, name: node.name })),
    [strata?.tree]
  );
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    buildingCode: "",
    file: null as File | null,
    fileName: "",
  });

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesCategory = activeCategoryId
        ? document.categoryId === activeCategoryId
        : true;
      const matchesQuery = normalized
        ? [document.title, document.description, document.categoryLabel]
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        : true;

      return matchesCategory && matchesQuery;
    });
  }, [activeCategoryId, documents, query]);

  const selectedDocument = selectedDocumentId
    ? documents.find((document) => document.id === selectedDocumentId) ?? null
    : null;

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadForm((current) => ({
      ...current,
      title: current.title || file.name,
      file,
      fileName: file.name,
    }));
    event.target.value = "";
  }

  function uploadDocument() {
    const title = uploadForm.title.trim();
    const description = uploadForm.description.trim();
    if (!title || !description || !uploadForm.categoryId || !uploadForm.file) {
      return;
    }

    createDocumentAdminMutation.mutate(
      {
        title,
        description,
        categoryId: uploadForm.categoryId,
        buildingCode: uploadForm.buildingCode || undefined,
        file: uploadForm.file,
      },
      {
        onSuccess: (nextDocument) => {
          setSelectedDocumentId(nextDocument.id);
          setIsUploadModalOpen(false);
          setUploadForm({
            title: "",
            description: "",
            categoryId: categories[0]?.id ?? "",
            buildingCode: "",
            file: null,
            fileName: "",
          });
        },
      }
    );
  }

  return (
    <>
      {selectedDocument ? (
        <DashboardModal
          title={selectedDocument.previewTitle}
          description={selectedDocument.previewBody}
          onClose={() => setSelectedDocumentId(null)}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <DocumentMetaCard label="File Name" value={selectedDocument.title} />
              <DocumentMetaCard label="Category" value={selectedDocument.categoryLabel} />
              <DocumentMetaCard label="File Type" value={selectedDocument.fileTypeLabel} />
              <DocumentMetaCard label="Updated" value={selectedDocument.updatedAtLabel} />
            </div>

            <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Description</p>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                {selectedDocument.description}
              </p>
            </div>

            {selectedDocument.fileUrl ? (
              <a
                href={selectedDocument.fileUrl}
                download={selectedDocument.title}
                className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Download File
              </a>
            ) : null}
          </div>
        </DashboardModal>
      ) : null}

      {isUploadModalOpen ? (
        <DashboardModal
          title={documentsAdmin?.uploadTitle ?? "Upload Document"}
          description={documentsAdmin?.uploadDescription ?? ""}
          onClose={() => setIsUploadModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Title</span>
                <input
                  value={uploadForm.title}
                  onChange={(event) =>
                    setUploadForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Category</span>
                <select
                  value={uploadForm.categoryId}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-500">Visibility</span>
                <select
                  value={uploadForm.buildingCode}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      buildingCode: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
                >
                  <option value="">All buildings</option>
                  {buildingOptions.map((building) => (
                    <option key={building.code} value={building.code}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Description
              </span>
              <textarea
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-500">File</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(event) => {
                  handleFileSelection(event).catch(() => {
                    event.target.value = "";
                  });
                }}
                className="mt-2 block w-full text-sm text-ink-700 file:mr-4 file:rounded-pill file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <p className="mt-2 text-xs text-ink-500">
                {uploadForm.fileName || "No file selected"}
              </p>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={uploadDocument}
                disabled={
                  createDocumentAdminMutation.isPending ||
                  !uploadForm.title.trim() ||
                  !uploadForm.description.trim() ||
                  !uploadForm.file
                }
                className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-border-100 disabled:bg-surface-100 disabled:text-ink-400"
              >
                {createDocumentAdminMutation.isPending ? "Uploading..." : "Upload Document"}
              </button>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
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
          title={documentsAdmin?.title ?? "Document Centre"}
          description={documentsAdmin?.description ?? ""}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Upload Document
              </button>
              <a
                href="#/documentRequests"
                className="inline-flex rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
              >
                Open Request Queue
              </a>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={documentsAdmin?.searchPlaceholder ?? "Find a specific file..."}
                className="min-w-[220px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className={`rounded-pill px-4 py-2 text-sm font-semibold transition ${
                  activeCategoryId === null
                    ? "bg-brand-900 text-white"
                    : "border border-border-100 bg-white text-ink-700"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`rounded-pill px-4 py-2 text-sm font-semibold transition ${
                    activeCategoryId === category.id
                      ? "bg-brand-900 text-white"
                      : "border border-border-100 bg-white text-ink-700"
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border-100 bg-white">
              <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px] gap-4 border-b border-border-100 bg-canvas-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                <p>{documentsAdmin?.repository.tableHeaders.fileName ?? "FILE NAME"}</p>
                <p>{documentsAdmin?.repository.tableHeaders.description ?? "DESCRIPTION"}</p>
                <p>{documentsAdmin?.repository.tableHeaders.actions ?? "ACTIONS"}</p>
              </div>

              <div>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <DocumentRowSkeleton key={index} />
                    ))
                  : filteredDocuments.map((document, index) => (
                      <div
                        key={document.id}
                        className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px] gap-4 px-5 py-4 ${
                          index === 0 ? "" : "border-t border-border-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-900">
                            {document.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getToneClass(document.tone)}`}
                            >
                              {document.fileTypeLabel}
                            </span>
                            <span className="text-xs text-ink-500">{document.sizeLabel}</span>
                            <span className="text-xs text-ink-500">{document.updatedAtLabel}</span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm leading-6 text-ink-700">{document.description}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                            {document.categoryLabel}
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDocumentId(document.id)}
                            className="rounded-pill border border-border-100 px-3 py-2 text-xs font-semibold text-ink-700"
                          >
                            View
                          </button>
                          {document.fileUrl ? (
                            <a
                              href={document.fileUrl}
                              download={document.title}
                              className="rounded-pill border border-brand-900 px-3 py-2 text-xs font-semibold text-brand-900"
                            >
                              Download
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                {!isLoading && filteredDocuments.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-ink-500">
                    No documents match the current search or category filter.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function DocumentMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function DocumentRowSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_120px] gap-4 px-5 py-4">
      <div className="space-y-2">
        <div className="h-4 w-40 animate-pulse rounded-full bg-surface-100" />
        <div className="h-3 w-32 animate-pulse rounded-full bg-surface-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-full bg-surface-100" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-100" />
      </div>
      <div className="h-9 w-20 animate-pulse rounded-pill bg-surface-100" />
    </div>
  );
}

function getToneClass(tone: DocumentFileTone) {
  return tone === "danger"
    ? "bg-rose-50 text-rose-700"
    : tone === "info"
      ? "bg-sky-50 text-sky-700"
      : tone === "success"
        ? "bg-emerald-50 text-success-700"
        : "bg-surface-100 text-ink-700";
}
