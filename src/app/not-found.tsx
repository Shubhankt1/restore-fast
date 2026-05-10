import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-white/8 bg-white/4 p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
          Not found
        </div>
        <h2 className="mt-3 text-3xl font-black text-white">
          This project or punch item does not exist.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Check the route or head back to the project list to pick up the next
          item.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
