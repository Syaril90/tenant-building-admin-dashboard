import { DashboardPanel } from "./dashboard-panel";

import type { DashboardPageSection, DashboardTone } from "../types";

type PageSectionsProps = {
  isLoading: boolean;
  sections: DashboardPageSection[];
};

export function PageSections({ isLoading, sections }: PageSectionsProps) {
  return (
    <div className="space-y-6">
      {isLoading
        ? Array.from({ length: 2 }).map((_, index) => (
            <DashboardPanel
              key={index}
              title="Loading section"
              description="Preparing page skeleton..."
            >
              <SectionSkeleton />
            </DashboardPanel>
          ))
        : sections.map((section) => (
            <DashboardPanel
              key={section.id}
              title={section.title}
              description={section.description}
            >
              <div className="space-y-4">
                {section.ctaLabel ? (
                  <div className="flex justify-end">
                    <button className="inline-flex rounded-pill border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900">
                      {section.ctaLabel}
                    </button>
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  {section.items.map((item) => (
                    <PageSectionItemCard
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      meta={item.meta}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>
            </DashboardPanel>
          ))}
    </div>
  );
}

function PageSectionItemCard({
  title,
  description,
  meta,
  tone,
}: {
  title: string;
  description: string;
  meta: string;
  tone?: DashboardTone;
}) {
  return (
    <article className="rounded-lg border border-border-100 bg-canvas-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-brand-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
        </div>
        {tone ? <ToneDot tone={tone} /> : null}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink-500">{meta}</p>
    </article>
  );
}

function ToneDot({ tone }: { tone: DashboardTone }) {
  return (
    <span
      className={`mt-1 h-2.5 w-2.5 rounded-full ${
        tone === "warning"
          ? "bg-warning-700"
          : tone === "success"
            ? "bg-success-700"
            : "bg-brand-900"
      }`}
    />
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border-100 bg-canvas-50 p-5"
        >
          <div className="h-6 w-40 animate-pulse rounded-full bg-surface-100" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-surface-100" />
          <div className="mt-4 h-4 w-32 animate-pulse rounded-full bg-surface-100" />
        </div>
      ))}
    </div>
  );
}
