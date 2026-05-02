import { useEffect, useState } from "react";
import QRCode from "qrcode";

import type { StrataTreeNode } from "../types";
import type { EditorTargetType } from "./tree-editor-modal";

export function StrataTreeCard({
  node,
  depth,
  parentId,
  buildingParkingQuota,
  onCreate,
  onEdit,
  onDelete,
  onUpdateBuildingQuota,
}: {
  node: StrataTreeNode;
  depth: number;
  parentId?: string;
  buildingParkingQuota?: number;
  onCreate: (targetType: EditorTargetType, parentId?: string) => void;
  onEdit: (node: StrataTreeNode, parentId?: string) => void;
  onDelete: (nodeId: string) => void;
  onUpdateBuildingQuota: (buildingCode: string, totalSlots: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const childCount = node.children?.length ?? 0;
  const hasChildren = childCount > 0;
  const isBuilding = node.type === "building";

  return (
    <div
      className="rounded-lg border border-border-100 bg-white shadow-card"
      style={{ marginLeft: depth * 18 }}
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!hasChildren}
              onClick={() => setIsExpanded((current) => !current)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-pill border ${
                hasChildren
                  ? "border-brand-900 bg-brand-100 text-brand-900"
                  : "border-border-100 bg-surface-100 text-ink-500"
              }`}
            >
              {hasChildren ? (isExpanded ? "−" : "+") : "•"}
            </button>
            <span
              className={`inline-flex rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                node.type === "building"
                  ? "bg-brand-100 text-brand-900"
                  : node.type === "area"
                    ? "bg-emerald-50 text-success-700"
                    : "bg-amber-50 text-warning-700"
              }`}
            >
              {node.type}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-ink-500">{node.code}</span>
          </div>
          <h3 className="mt-3 text-lg font-bold text-brand-900">{node.name}</h3>
          <p className="mt-1 text-sm text-ink-500">{node.status}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-pill bg-canvas-50 px-3 py-1 text-xs font-medium text-ink-700">
              {node.countsLabel}
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {node.documentsExpected.map((document) => (
              <li key={document} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-900" />
                <span>{document}</span>
              </li>
            ))}
          </ul>
          {isBuilding ? (
            <div className="mt-4 space-y-4 rounded-lg border border-border-100 bg-canvas-50 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="rounded-md border border-border-100 bg-white p-2 shadow-card">
                  <BuildingQr code={node.code} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Building QR</p>
                  <p className="mt-2 text-sm font-semibold text-brand-900">{node.code}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Scan to identify this building root during import, registration or operations.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                      Building Config
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      Operational Settings
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Centralize building-level controls here so more config can be added later.
                    </p>
                  </div>
                  <span className="rounded-pill bg-canvas-50 px-3 py-1 text-xs font-semibold text-ink-700">
                    1 active setting
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">
                      Visitor Parking Limit
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Shared building quota used by visitor approvals and parking checks.
                    </p>
                  </div>
                  <label className="block">
                    <span className="sr-only">Visitor parking limit</span>
                    <input
                      type="number"
                      min={0}
                      value={buildingParkingQuota ?? 0}
                      onChange={(event) =>
                        onUpdateBuildingQuota(
                          node.code,
                          Number.parseInt(event.target.value || "0", 10),
                        )
                      }
                      className="w-full rounded-lg border border-border-100 bg-white px-4 py-3 text-sm text-ink-700 outline-none transition focus:border-brand-900"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto">
          {node.type !== "unit" ? (
            <button
              type="button"
              onClick={() => onCreate(node.type === "building" ? "area" : "unit", node.id)}
              className="inline-flex items-center justify-center rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
            >
              {node.type === "building" ? "Add area" : "Add unit"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(node, parentId)}
            className="inline-flex items-center justify-center rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="inline-flex items-center justify-center rounded-pill border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-4 border-t border-border-100 px-4 py-4">
          {node.children?.map((child) => (
            <StrataTreeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              parentId={node.id}
              buildingParkingQuota={buildingParkingQuota}
              onCreate={onCreate}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateBuildingQuota={onUpdateBuildingQuota}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BuildingQr({ code }: { code: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(code, {
      margin: 1,
      width: 126,
      color: {
        dark: "#171C1F",
        light: "#FFFFFF"
      }
    })
      .then(setDataUrl)
      .catch(() => {
        setDataUrl("");
      });
  }, [code]);

  return (
    <div className="flex h-[126px] w-[126px] items-center justify-center bg-white">
      {dataUrl ? <img src={dataUrl} alt={`QR for ${code}`} className="h-full w-full" /> : null}
    </div>
  );
}
