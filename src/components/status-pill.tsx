import type { PunchItemPriority, PunchItemStatus } from "@/lib/punch-contract";

const statusStyles: Record<PunchItemStatus, string> = {
  open: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  in_progress: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  complete: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

const priorityStyles: Record<PunchItemPriority, string> = {
  low: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  normal: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  high: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

function labelize(value: string): string {
  return value.replaceAll("_", " ");
}

export function StatusPill({ status }: { status: PunchItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusStyles[status]}`}
    >
      {labelize(status)}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: PunchItemPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}

export function StatusLabel({ value }: { value: string }) {
  return (
    <span className="text-sm capitalize text-slate-200">{labelize(value)}</span>
  );
}
