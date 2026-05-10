"use client";

import Link from "next/link";

type RouteErrorProps = {
  title: string;
  description: string;
  reset: () => void;
};

export function RouteError({ title, description, reset }: RouteErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-500/10 p-8 text-center shadow-[0_30px_80px_-40px_rgba(127,29,29,0.8)]">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">
          Something broke
        </div>
        <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-rose-100/80">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}
