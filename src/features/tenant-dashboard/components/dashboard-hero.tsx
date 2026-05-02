type DashboardHeroProps = {
  isLoading: boolean;
  unitLabel?: string;
  title?: string;
  description?: string;
  currentViewLabel?: string;
};

export function DashboardHero({
  isLoading,
  unitLabel,
  title,
  description,
  currentViewLabel,
}: DashboardHeroProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border-100 bg-white shadow-floating">
      <div className="grid gap-6 bg-[linear-gradient(135deg,#003178_0%,#0D47A1_58%,#1a5dc2_100%)] px-6 py-8 text-white lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <span className="inline-flex rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
            Building Operations Console
          </span>
          {isLoading ? (
            <>
              <div className="h-5 w-36 animate-pulse rounded-full bg-white/20" />
              <div className="h-12 w-72 animate-pulse rounded-2xl bg-white/20" />
              <div className="h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/15" />
            </>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.18em] text-white/70">
                {unitLabel}
              </p>
              <div>
                <h2 className="text-4xl font-black tracking-[-0.04em]">{title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
                  {description}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/20" />
              <div className="h-8 w-40 animate-pulse rounded-full bg-white/20" />
              <div className="h-4 w-full animate-pulse rounded-full bg-white/15" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/15" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                Current View
              </p>
              <h3 className="text-2xl font-bold">{currentViewLabel}</h3>
              <p className="text-sm leading-6 text-white/80">
                Structured as a focused admin workspace for building operations,
                communications, records, and service response.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
