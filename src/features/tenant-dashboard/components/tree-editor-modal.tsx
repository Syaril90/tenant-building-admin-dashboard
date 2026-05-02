export type EditorMode = "create" | "edit";
export type EditorTargetType = "building" | "area" | "unit";

export type TreeEditorState = {
  mode: EditorMode;
  targetType: EditorTargetType;
  nodeId?: string;
  parentId?: string;
  name: string;
  code: string;
  status: string;
  documentsExpected: string;
} | null;

export function TreeEditorModal({
  editorState,
  onChange,
  onClose,
  onSubmit
}: {
  editorState: TreeEditorState;
  onChange: (next: TreeEditorState) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!editorState) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/35 px-4 py-8">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border-100 bg-white p-6 shadow-floating">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Strata Editor</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
              {editorState.mode === "create" ? "Create" : "Edit"} {editorState.targetType}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Manage building, area and unit records without leaving the tree workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-pill border border-border-100 text-ink-500"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-900">Name</span>
            <input
              value={editorState.name}
              onChange={(event) => onChange({ ...editorState, name: event.target.value })}
              className="w-full rounded-md border border-border-100 px-4 py-3 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-900">Code</span>
            <input
              value={editorState.code}
              onChange={(event) => onChange({ ...editorState, code: event.target.value })}
              className="w-full rounded-md border border-border-100 px-4 py-3 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-900">Status</span>
            <input
              value={editorState.status}
              onChange={(event) => onChange({ ...editorState, status: event.target.value })}
              className="w-full rounded-md border border-border-100 px-4 py-3 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-900">Expected documents</span>
            <textarea
              value={editorState.documentsExpected}
              onChange={(event) =>
                onChange({ ...editorState, documentsExpected: event.target.value })
              }
              className="min-h-28 w-full rounded-md border border-border-100 px-4 py-3 text-sm"
              placeholder="Comma separated values"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex rounded-pill bg-brand-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {editorState.mode === "create" ? "Create node" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-pill border border-border-100 px-4 py-2 text-sm font-semibold text-ink-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
