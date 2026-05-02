import type { ReactNode } from "react";

type DashboardModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function DashboardModal({
  title,
  description,
  onClose,
  children,
}: DashboardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/72 p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="relative z-10 max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-[-0.03em] text-brand-900">{title}</h3>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-border-100 text-sm font-semibold text-ink-500 transition hover:bg-canvas-50"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(88vh-5.5rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
