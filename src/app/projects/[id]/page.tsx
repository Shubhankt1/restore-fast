import Link from "next/link";
import { notFound } from "next/navigation";
import { BreakdownCard } from "@/components/breakdown-card";
import { EmptyState } from "@/components/empty-state";
import { ItemCreateModal } from "@/components/forms";
import { ItemList } from "@/components/item-list";
import { MetricCard } from "@/components/metric-card";
import { PriorityPill, StatusLabel } from "@/components/status-pill";
import type { BreakdownEntry } from "@/lib/punch-contract";
import {
  calculateCompletionPercent,
  deriveProjectStatusFromCounts,
  sortBreakdownEntries,
} from "@/lib/punchlist-domain.mjs";
import { getProject, listProjects } from "@/lib/repositories/projects";
import { listItemsForProject } from "@/lib/repositories/punch-items";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

type ProjectRecord = Awaited<ReturnType<typeof getProject>>;
type ProjectListRecord = Awaited<ReturnType<typeof listProjects>>[number];
type PunchItemRecord = Awaited<ReturnType<typeof listItemsForProject>>[number];

function summarizeProject(project: NonNullable<ProjectRecord>) {
  const counts = project.punchItems.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      accumulator.total += 1;
      return accumulator;
    },
    { open: 0, in_progress: 0, complete: 0, total: 0 },
  );

  return {
    ...project,
    status: deriveProjectStatusFromCounts(counts),
    itemCount: counts.total,
    completionPercent: calculateCompletionPercent(
      counts.complete,
      counts.total,
    ),
  };
}

function groupItemsByLabel(
  items: PunchItemRecord[],
  keySelector: (item: PunchItemRecord) => string,
): BreakdownEntry[] {
  const grouped = new Map<
    string,
    {
      label: string;
      count: number;
      completeCount: number;
      inProgressCount: number;
      openCount: number;
    }
  >();

  for (const item of items) {
    const label = keySelector(item).trim() || "Unassigned";
    const bucket = grouped.get(label) ?? {
      label,
      count: 0,
      completeCount: 0,
      inProgressCount: 0,
      openCount: 0,
    };

    bucket.count += 1;
    bucket[
      item.status === "complete"
        ? "completeCount"
        : item.status === "in_progress"
          ? "inProgressCount"
          : "openCount"
    ] += 1;
    grouped.set(label, bucket);
  }

  return sortBreakdownEntries(
    Array.from(grouped.values()).map((bucket) => ({
      ...bucket,
      completionPercent: calculateCompletionPercent(
        bucket.completeCount,
        bucket.count,
      ),
    })),
  );
}

function buildDashboard(items: PunchItemRecord[]) {
  const countsByStatus = items.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { open: 0, in_progress: 0, complete: 0 },
  );

  return {
    completionPercent: calculateCompletionPercent(
      countsByStatus.complete,
      items.length,
    ),
    countsByStatus,
    byLocation: groupItemsByLabel(items, (item) => item.location),
    byPriority: sortBreakdownEntries(
      (["low", "normal", "high"] as const).map((priority) => {
        const bucketItems = items.filter((item) => item.priority === priority);
        const completeCount = bucketItems.filter(
          (item) => item.status === "complete",
        ).length;

        return {
          label: priority,
          count: bucketItems.length,
          completeCount,
          inProgressCount: bucketItems.filter(
            (item) => item.status === "in_progress",
          ).length,
          openCount: bucketItems.filter((item) => item.status === "open")
            .length,
          completionPercent: calculateCompletionPercent(
            completeCount,
            bucketItems.length,
          ),
        };
      }),
    ),
    byAssignee: groupItemsByLabel(
      items,
      (item) => item.assignedTo ?? "Unassigned",
    ),
  };
}

function toUiItem(item: PunchItemRecord) {
  return {
    ...item,
    assignedTo: item.assignedTo ?? "Unassigned",
    createdAt: item.createdAt.toISOString(),
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const [project, items, projects] = await Promise.all([
    getProject(id),
    listItemsForProject(id),
    listProjects(),
  ]);

  if (!project) {
    notFound();
  }

  const summary = summarizeProject(project);
  const dashboard = buildDashboard(items);

  const openItems = dashboard.countsByStatus.open;
  const inProgressItems = dashboard.countsByStatus.in_progress;
  const completeItems = dashboard.countsByStatus.complete;
  const projectIndex =
    projects.findIndex((entry: ProjectListRecord) => entry.id === project.id) +
    1;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(15,23,42,0.88)_60%,rgba(2,6,23,0.94))] p-6 shadow-[0_40px_120px_-60px_rgba(251,191,36,0.55)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 lg:max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-amber-200"
              >
                Projects
              </Link>
              <span className="text-slate-600">/</span>
              <StatusLabel value={summary.status} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {summary.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                {summary.address}
              </p>
            </div>
          </div>
          <div className="space-y-4 lg:min-w-[320px]">
            <div className="flex lg:justify-end">
              <ItemCreateModal projectId={summary.id} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <MetricCard
                title="Completion"
                value={`${summary.completionPercent ?? 0}%`}
                caption="Project punch closure"
              />
              <MetricCard
                title="Items"
                value={`${summary.itemCount ?? 0}`}
                caption="Tracked punch items"
              />
              <MetricCard
                title="Project #"
                value={`0${projectIndex}`.slice(-2)}
                caption=""
              />
            </div>
          </div>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800/90">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400"
            style={{ width: `${summary.completionPercent ?? 0}%` }}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {openItems} open
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {inProgressItems} in progress
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {completeItems} complete
          </span>
          <PriorityPill priority="high" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Overall"
          value={`${dashboard.completionPercent}%`}
          caption="Dashboard completion"
        />
        <MetricCard
          title="Open"
          value={`${openItems}`}
          caption="Needs attention"
        />
        <MetricCard
          title="Active"
          value={`${inProgressItems}`}
          caption="Currently moving"
        />
        <MetricCard
          title="Closed"
          value={`${completeItems}`}
          caption="Ready to hand over"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <BreakdownCard title="By location" entries={dashboard.byLocation} />
        <BreakdownCard title="By priority" entries={dashboard.byPriority} />
        <BreakdownCard title="By assignee" entries={dashboard.byAssignee} />
      </section>

      <section className="rounded-3xl border border-white/8 bg-slate-900/70 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              Item list
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Track all open work against this project.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            {items.length} items
          </span>
        </div>
        <div className="mt-5">
          {items.length > 0 ? (
            <ItemList items={items.map(toUiItem)} />
          ) : (
            <EmptyState
              title="No items yet"
              description="Create the first punch item to capture scope, location, and assignment."
            />
          )}
        </div>
      </section>
    </div>
  );
}
