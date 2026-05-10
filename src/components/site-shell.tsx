import Link from "next/link";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.16),_transparent_34%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm font-black tracking-[0.28em] text-amber-300 transition group-hover:border-amber-300 group-hover:bg-amber-400/20">
              RF
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">
                Punch List Tracker
              </span>
              <span className="block text-sm text-slate-300">
                Construction closeout board
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Field ready
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
