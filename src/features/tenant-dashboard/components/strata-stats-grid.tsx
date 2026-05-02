import { DashboardStatCard } from "./dashboard-stat-card";

type StrataStatsGridProps = {
  buildingCount: number;
  totalNodes: number;
  onAddBuilding: () => void;
};

export function StrataStatsGrid({
  buildingCount,
  totalNodes,
  onAddBuilding,
}: StrataStatsGridProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
      <DashboardStatCard
        label="Buildings Registered"
        value={buildingCount}
        hint="Top-level building structures currently configured."
        tone="brand"
      />
      <DashboardStatCard
        label="Total Nodes"
        value={totalNodes}
        hint="Buildings, areas, and units currently represented in the tree."
        tone="success"
      />
      <article className="rounded-lg border border-brand-900 bg-brand-900 p-5 shadow-card">
        <span className="inline-flex rounded-pill bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
          Structure Actions
        </span>
        <p className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
          Add a new building
        </p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white">
          Start a fresh building root and continue adding areas or units directly inside the tree.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddBuilding}
            className="inline-flex rounded-pill border border-white bg-white px-5 py-2.5 text-sm font-semibold text-brand-900"
          >
            + Add Building
          </button>
        </div>
      </article>
    </section>
  );
}
