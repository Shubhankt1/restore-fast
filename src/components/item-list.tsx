import Link from "next/link";
import type { PunchItem } from "@/lib/punch-contract";
import { PriorityPill, StatusPill } from "@/components/status-pill";

type ItemListProps = {
  items: PunchItem[];
};

export function ItemList({ items }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/4 p-8 text-sm text-slate-400">
        No punch items yet. Add the first item to start the walkdown.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/items/${item.id}`}
          className="block rounded-3xl border border-white/8 bg-white/4 p-4 transition hover:-translate-y-0.5 hover:border-amber-400/25 hover:bg-white/7"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={item.status} />
                <PriorityPill priority={item.priority} />
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  {item.assignedTo}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {item.location}
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Open item
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
