import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/12 bg-white/4 p-8 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-xl font-black text-amber-200">
        +
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
        {description}
      </p>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
