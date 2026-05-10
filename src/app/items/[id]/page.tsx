import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ItemAssignmentForm,
  ItemPhotoForm,
  ItemStatusForm,
} from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PriorityPill, StatusPill } from "@/components/status-pill";
import { getProject } from "@/lib/repositories/projects";
import { getPunchItem } from "@/lib/repositories/punch-items";

export const dynamic = "force-dynamic";

type ItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ItemDetailPage({ params }: ItemPageProps) {
  const { id } = await params;
  const item = await getPunchItem(id);

  if (!item) {
    notFound();
  }

  const project = await getProject(item.projectId);
  const nextStatuses =
    item.status === "open"
      ? ["in_progress", "complete"]
      : item.status === "in_progress"
        ? ["complete"]
        : [];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(15,23,42,0.88)_60%,rgba(2,6,23,0.94))] p-6 shadow-[0_40px_120px_-60px_rgba(251,191,36,0.55)] sm:p-8">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="transition hover:text-amber-200">
              Projects
            </Link>
            <span>/</span>
            {project ? (
              <Link
                href={`/projects/${project.id}`}
                className="transition hover:text-amber-200"
              >
                {project.name}
              </Link>
            ) : null}
            <span>/</span>
            <span className="text-slate-200">Item</span>
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Created {item.createdAt.toLocaleDateString()}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={item.status} />
              <PriorityPill priority={item.priority} />
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {item.assignedTo ?? "Unassigned"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {item.location}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                {item.description}
              </p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            <MetricCard
              title="Status"
              value={item.status.replaceAll("_", " ")}
              caption="Current state"
            />
            <MetricCard
              title="Priority"
              value={item.priority}
              caption="Dispatch urgency"
            />
            {/* <MetricCard
              title="Moves left"
              value={`${nextStatuses.length}`}
              caption="Forward transitions"
            /> */}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-6">
          <ItemStatusForm itemId={item.id} currentStatus={item.status} />
          <ItemAssignmentForm
            itemId={item.id}
            assignedTo={item.assignedTo ?? ""}
          />
        </div>
        <ItemPhotoForm itemId={item.id} currentPhoto={item.photo} />
      </section>
    </div>
  );
}
