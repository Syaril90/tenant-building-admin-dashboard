import { DashboardPanel } from "./dashboard-panel";

import type { StrataNodeType, StrataUploadMeta } from "../types";

type PendingUploadTarget = {
  id: string;
  type: StrataNodeType;
  name: string;
} | null;

type UploadSummaryPanelProps = {
  title: string;
  description: string;
  pendingUploadTarget: PendingUploadTarget;
  uploadsByNode: Record<string, StrataUploadMeta[]>;
};

export function UploadSummaryPanel({
  title,
  description,
  pendingUploadTarget,
  uploadsByNode,
}: UploadSummaryPanelProps) {
  return (
    <DashboardPanel title={title} description={description}>
      <div className="space-y-4">
        {pendingUploadTarget ? (
          <div className="rounded-lg border border-border-100 bg-canvas-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
              Current Target
            </p>
            <h3 className="mt-2 text-lg font-bold text-brand-900">
              {pendingUploadTarget.name}
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              {pendingUploadTarget.type === "area"
                ? "Area-level files apply to every related unit under this branch."
                : pendingUploadTarget.type === "unit"
                  ? "Unit-level files stay assigned to this exact unit record."
                  : "Building-level files stay at the building root."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border-100 bg-canvas-50 p-4 text-sm text-ink-500">
            Choose `Upload Files` on any building, area or unit node.
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(uploadsByNode).length === 0 ? (
            <div className="rounded-lg border border-border-100 bg-canvas-50 p-4 text-sm text-ink-500">
              No uploads yet. Start by attaching shared building plans to an area or resident documents to a
              unit.
            </div>
          ) : (
            Object.entries(uploadsByNode).map(([nodeId, files]) => (
              <div key={nodeId} className="rounded-lg border border-border-100 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-500">{nodeId}</p>
                <ul className="mt-2 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate font-medium text-brand-900">{file.name}</span>
                      <span className="shrink-0 text-ink-500">{formatFileSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
