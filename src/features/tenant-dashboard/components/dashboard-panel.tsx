import type { ReactNode } from "react";

export function DashboardPanel({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-100 bg-white p-6 shadow-card">
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-brand-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
