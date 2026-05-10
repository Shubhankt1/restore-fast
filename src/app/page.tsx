import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ItemList } from "@/components/item-list";
import { MetricCard } from "@/components/metric-card";
import { ProjectCreateForm } from "@/components/forms";
import { PriorityPill, StatusLabel } from "@/components/status-pill";
import type { PunchItem as UiPunchItem } from "@/lib/punch-contract";
import {
  calculateCompletionPercent,
  deriveProjectStatusFromCounts,
} from "@/lib/punchlist-domain.mjs";
import { listProjects } from "@/lib/repositories/projects";
import { listRecentItems } from "@/lib/repositories/punch-items";

export const dynamic = "force-dynamic";

type ProjectRecord = Awaited<ReturnType<typeof listProjects>>[number];
type RecentItemRecord = Awaited<ReturnType<typeof listRecentItems>>[number];

function summarizeProject(project: ProjectRecord) {
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

function toUiItem(item: RecentItemRecord): UiPunchItem {
  return {
    ...item,
    assignedTo: item.assignedTo ?? "Unassigned",
    createdAt: item.createdAt.toISOString(),
  };
}

export default async function HomePage() {
  const projects = (await listProjects()).map(summarizeProject);
  const recentItems = await listRecentItems(4);
  const featuredProject =
    projects.find((project) => (project.itemCount ?? 0) > 0) ?? projects[0];

  const totalItems = projects.reduce(
    (sum, project) => sum + (project.itemCount ?? 0),
    0,
  );
  const weightedCompletion =
    totalItems === 0
      ? 0
      : Math.round(
          projects.reduce(
            (sum, project) =>
              sum + (project.completionPercent ?? 0) * (project.itemCount ?? 0),
            0,
          ) / totalItems,
        );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(15,23,42,0.88)_55%,rgba(2,6,23,0.94))] p-6 shadow-[0_40px_120px_-60px_rgba(251,191,36,0.6)] sm:p-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Project command center
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Track every punch item from open to done.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Manage closeout work with a view that feels like the jobsite:
              high-contrast, fast to scan, and focused on what still needs
              attention.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Projects"
              value={`${projects.length}`}
              caption="Active sites in the tracker"
            />
            <MetricCard
              title="Items"
              value={`${totalItems}`}
              caption="Punch items across all projects"
            />
            <MetricCard
              title="Completion"
              value={`${weightedCompletion}%`}
              caption="Overall weighted completion"
            />
          </div>
        </div>
        <div id="create-project">
          <ProjectCreateForm />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">
                Projects
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Completion at a glance, sorted by the newest site.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {projects.length} total
            </span>
          </div>
          {projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-3xl border border-white/8 bg-white/4 p-5 transition hover:-translate-y-0.5 hover:border-amber-400/25 hover:bg-white/7"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusLabel value={project.status} />
                        <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          {project.itemCount ?? 0} items
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {project.address}
                      </p>
                    </div>
                    <div className="min-w-28 text-right">
                      <div className="text-3xl font-black text-white">
                        {project.completionPercent ?? 0}%
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                        Complete
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400"
                      style={{ width: `${project.completionPercent ?? 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No projects yet"
              description="Create the first project to start tracking punch work, closeout items, and completion metrics."
              actionHref="#create-project"
              actionLabel="Create project"
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">
              Recent work
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Most recent project items for quick triage.
            </p>
          </div>
          {recentItems.length > 0 ? (
            <ItemList items={recentItems.slice(0, 4).map(toUiItem)} />
          ) : (
            <EmptyState
              title="Nothing to review"
              description="Choose a project to inspect items or create the first punch entry from a project page."
              actionHref={
                featuredProject ? `/projects/${featuredProject.id}` : undefined
              }
              actionLabel="Open project"
            />
          )}
        </div>
      </section>
    </div>
  );
}
