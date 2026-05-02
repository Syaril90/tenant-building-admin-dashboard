import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import { DashboardPanel } from "./dashboard-panel";
import {
  ImportFeedbackBanner,
  type ImportFeedback,
} from "./import-feedback-banner";
import { StrataStatsGrid } from "./strata-stats-grid";
import { StrataTreeCard } from "./strata-tree-card";
import {
  TreeEditorModal,
  type EditorTargetType,
  type TreeEditorState,
} from "./tree-editor-modal";
import { useSaveTenantStrataMutation } from "../queries/use-save-tenant-strata-mutation";
import { useSaveVisitorAdminMutation } from "../queries/use-save-visitor-admin-mutation";
import {
  ImportValidationError,
  collectMergeConflicts,
  convertTreeToCsv,
  countAllNodes,
  countTopLevelNodes,
  downloadTextFile,
  insertChildNode,
  mergeTreeCollections,
  normalizeNode,
  normalizeTree,
  parseCsvTree,
  parseJsonTree,
  removeNodeById,
  removeUploadsForNode,
  slugify,
  splitDocuments,
  validateTree,
  updateNodeById,
} from "../strata-utils";
import type {
  DashboardPageSection,
  StrataNodeType,
  StrataRegistration,
  StrataTreeNode,
  VisitorAdmin,
} from "../types";

type StrataRouteProps = {
  isLoading: boolean;
  strata?: StrataRegistration;
  visitorAdmin?: VisitorAdmin;
  sections: DashboardPageSection[];
};

export function StrataRoute({
  isLoading,
  strata,
  visitorAdmin,
  sections: _sections,
}: StrataRouteProps) {
  const saveTenantStrataMutation = useSaveTenantStrataMutation();
  const saveVisitorAdminMutation = useSaveVisitorAdminMutation();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [editorState, setEditorState] = useState<TreeEditorState>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(
    null,
  );

  const strataTree = strata?.tree ?? [];
  const uploadsByNode = strata?.uploadsByNode ?? {};
  const buildingConfigs = visitorAdmin?.buildingConfigs ?? [];

  function persistStrataWorkspace(
    nextTree: StrataTreeNode[],
    nextUploadsByNode = uploadsByNode,
  ) {
    saveTenantStrataMutation.mutate({
      tree: normalizeTree(nextTree),
      uploadsByNode: nextUploadsByNode,
    });
  }

  async function handleImportTree(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    const nextTree = validateTree(
      file.name.endsWith(".csv") ? parseCsvTree(text) : parseJsonTree(text),
    );
    const mergeConflicts =
      importMode === "merge" ? collectMergeConflicts(strataTree, nextTree) : [];

    persistStrataWorkspace(
      importMode === "replace"
        ? normalizeTree(nextTree)
        : mergeTreeCollections(strataTree, nextTree),
    );
    setImportFeedback({
      tone: "success",
      message: `${file.name} imported successfully in ${importMode} mode.`,
      details:
        mergeConflicts.length > 0
          ? mergeConflicts.map(
              (conflict) => `Merged existing node: ${conflict}`,
            )
          : [
              `${countTopLevelNodes(nextTree)} building roots processed`,
              `${countAllNodes(nextTree)} total nodes validated`,
            ],
    });
    event.target.value = "";
  }

  function exportTreeAsJson() {
    downloadTextFile(
      "strata-tree-export.json",
      JSON.stringify({ tree: strataTree }, null, 2),
      "application/json",
    );
  }

  function exportTreeAsCsv() {
    downloadTextFile(
      "strata-tree-export.csv",
      convertTreeToCsv(strataTree),
      "text/csv",
    );
  }

  function openCreateEditor(targetType: EditorTargetType, parentId?: string) {
    setEditorState({
      mode: "create",
      targetType,
      parentId,
      name: "",
      code: "",
      status: "",
      documentsExpected: "",
    });
  }

  function openEditEditor(node: StrataTreeNode, parentId?: string) {
    setEditorState({
      mode: "edit",
      targetType: node.type,
      nodeId: node.id,
      parentId,
      name: node.name,
      code: node.code,
      status: node.status,
      documentsExpected: node.documentsExpected.join(", "),
    });
  }

  function submitEditor() {
    if (!editorState || !editorState.name.trim() || !editorState.code.trim()) {
      return;
    }

    const draftNode: StrataTreeNode = normalizeNode({
      id:
        editorState.mode === "edit" && editorState.nodeId
          ? editorState.nodeId
          : `${editorState.targetType}-${slugify(editorState.code)}`,
      type: editorState.targetType,
      name: editorState.name.trim(),
      code: editorState.code.trim(),
      status: editorState.status.trim() || "Draft",
      countsLabel: "",
      documentsExpected: splitDocuments(editorState.documentsExpected),
      children: editorState.targetType === "unit" ? undefined : [],
    });

    let nextTree = strataTree;

    if (editorState.mode === "edit" && editorState.nodeId) {
      nextTree = updateNodeById(strataTree, editorState.nodeId, (existing) => ({
        ...draftNode,
        children: existing.children,
      }));
    } else if (!editorState.parentId) {
      nextTree = normalizeTree([...strataTree, draftNode]);
    } else {
      nextTree = insertChildNode(strataTree, editorState.parentId, draftNode);
    }

    persistStrataWorkspace(nextTree);
    setEditorState(null);
  }

  function deleteNode(nodeId: string) {
    const nextTree = removeNodeById(strataTree, nodeId);
    const nextUploadsByNode = removeUploadsForNode(uploadsByNode, nodeId);

    persistStrataWorkspace(nextTree, nextUploadsByNode);
  }

  function updateBuildingQuota(buildingCode: string, totalSlots: number) {
    saveVisitorAdminMutation.mutate({
      approvals: visitorAdmin?.approvals ?? [],
      buildingConfigs: buildingConfigs.map((config) =>
        config.buildingCode === buildingCode ? { ...config, totalSlots } : config,
      ),
    });
  }

  return (
    <>
      <TreeEditorModal
        editorState={editorState}
        onChange={setEditorState}
        onClose={() => setEditorState(null)}
        onSubmit={submitEditor}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={(event) => {
          handleImportTree(event).catch((error: unknown) => {
            const message =
              error instanceof ImportValidationError
                ? error.message
                : "Import failed. Please check the file structure and required columns.";
            const details =
              error instanceof ImportValidationError
                ? error.details
                : undefined;

            setImportFeedback({
              tone: "error",
              message,
              details,
            });
            event.target.value = "";
          });
        }}
      />

      <StrataStatsGrid
        buildingCount={strataTree.length}
        totalNodes={countAllNodes(strataTree)}
        onAddBuilding={() => openCreateEditor("building")}
      />

      <section>
        <DashboardPanel
          title={strata?.title ?? "Building Structure"}
          description={strata?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border-100 bg-canvas-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openCreateEditor("building")}
                  className="inline-flex rounded-pill border border-brand-900 bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  + Add Building
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900"
                >
                  Import JSON / CSV
                </button>
                <select
                  value={importMode}
                  onChange={(event) =>
                    setImportMode(event.target.value as "merge" | "replace")
                  }
                  className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
                >
                  <option value="merge">Import mode: merge</option>
                  <option value="replace">Import mode: replace</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={exportTreeAsJson}
                  className="inline-flex rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
                >
                  Export JSON
                </button>
                <details className="group relative">
                  <summary className="inline-flex cursor-pointer list-none rounded-pill border border-border-100 bg-white px-4 py-2 text-sm font-semibold text-ink-700 marker:content-none">
                    More Actions
                  </summary>
                  <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-border-100 bg-white p-3 shadow-card lg:absolute lg:right-0 lg:z-10 lg:min-w-56">
                    <button
                      type="button"
                      onClick={exportTreeAsCsv}
                      className="rounded-xl border border-border-100 px-4 py-2 text-left text-sm font-semibold text-ink-700"
                    >
                      Export CSV
                    </button>
                    <a
                      href="/samples/strata-tree-template.json"
                      download
                      className="rounded-xl border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
                    >
                      Sample template JSON
                    </a>
                    <a
                      href="/samples/strata-tree-new-building.json"
                      download
                      className="rounded-xl border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
                    >
                      Sample building JSON
                    </a>
                    <a
                      href="/samples/strata-tree-units.csv"
                      download
                      className="rounded-xl border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
                    >
                      Sample units CSV
                    </a>
                  </div>
                </details>
              </div>
            </div>
            <ImportFeedbackBanner feedback={importFeedback} />
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <TreeSkeleton key={index} />
                ))
              : strataTree.map((node) => (
                  <StrataTreeCard
                    key={node.id}
                    node={node}
                    depth={0}
                    buildingParkingQuota={
                      node.type === "building"
                        ? buildingConfigs.find((config) => config.buildingCode === node.code)
                            ?.totalSlots
                        : undefined
                    }
                    onCreate={openCreateEditor}
                    onEdit={openEditEditor}
                    onDelete={deleteNode}
                    onUpdateBuildingQuota={updateBuildingQuota}
                    parentId={undefined}
                  />
                ))}
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function TreeSkeleton() {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4 shadow-card">
      <div className="h-4 w-20 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-6 w-48 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}
