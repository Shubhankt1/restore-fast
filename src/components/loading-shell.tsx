export function LoadingShell() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-3xl border border-white/8 bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-28 rounded-3xl border border-white/8 bg-white/5" />
        <div className="h-28 rounded-3xl border border-white/8 bg-white/5" />
        <div className="h-28 rounded-3xl border border-white/8 bg-white/5" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/8" />
          <div className="h-24 rounded-2xl bg-white/8" />
        </div>
        <div className="space-y-4 rounded-3xl border border-white/8 bg-white/5 p-5">
          <div className="h-6 w-32 rounded bg-white/10" />
          <div className="h-52 rounded-2xl bg-white/8" />
        </div>
      </div>
    </div>
  );
}
