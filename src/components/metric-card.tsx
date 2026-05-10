type MetricCardProps = {
  title: string;
  value: string;
  caption: string;
};

export function MetricCard({ title, value, caption }: MetricCardProps) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/4 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {title}
      </p>
      <div className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </div>
      <p className="mt-2 text-sm text-slate-300">{caption}</p>
    </section>
  );
}
