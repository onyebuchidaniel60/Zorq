import type { ReactNode } from "react";

export function PlaceholderPanel({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Planned · {phase}
        </span>
      </div>
      <div className="mt-3 max-w-2xl text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}
