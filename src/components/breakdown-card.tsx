import type { BreakdownEntry } from "@/lib/punch-contract";

type BreakdownCardProps = {
  title: string;
  entries: BreakdownEntry[];
};

export function BreakdownCard({ title, entries }: BreakdownCardProps) {
  return (
    <section className="rounded-3xl border border-white/8 bg-slate-900/70 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          {title}
        </h3>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Breakdown
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-white/6 bg-white/3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {entry.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {entry.completeCount} complete, {entry.inProgressCount}{" "}
                    active, {entry.openCount} open
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {entry.count}
                  </div>
                  <div className="text-xs text-slate-400">
                    {entry.completionPercent}% complete
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400"
                  style={{ width: `${entry.completionPercent}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-slate-400">
            No items yet for this breakdown.
          </p>
        )}
      </div>
    </section>
  );
}
