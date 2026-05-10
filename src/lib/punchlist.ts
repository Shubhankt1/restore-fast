import { z } from "zod";

import {
  calculateCompletionPercent,
  deriveProjectStatusFromCounts,
  isForwardTransition,
  normalizeAssignedTo,
  priorityOrder,
  punchItemStatusOrder,
  sortBreakdownEntries,
} from "./punchlist-domain.mjs";
import type { PunchItemStatus, Priority } from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { prisma as defaultPrisma } from "./prisma";

const projectIdSchema = z.string().uuid();
const punchItemIdSchema = z.string().uuid();

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(300).nullable().optional(),
});

const createPunchItemSchema = z.object({
  location: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  priority: z.enum(priorityOrder as [Priority, ...Priority[]]).optional(),
  assignedTo: z.string().trim().max(120).nullable().optional(),
  photo: z.string().url().nullable().optional(),
});

const transitionPunchItemStatusSchema = z.object({
  status: z.enum(
    punchItemStatusOrder as [PunchItemStatus, ...PunchItemStatus[]],
  ),
  actor: z.string().trim().min(1).max(120).optional(),
});

const updatePunchItemAssignmentSchema = z.object({
  assignedTo: z.string().trim().max(120).nullable(),
});

const updatePunchItemPhotoSchema = z.object({
  photo: z.string().url(),
});

type PrismaClientLike = typeof defaultPrisma;

type BreakdownEntry = {
  label: string;
  count: number;
  completionPercent?: number;
  completeCount?: number;
};

type DashboardMetrics = {
  completionPercent: number;
  byLocation: BreakdownEntry[];
  byPriority: BreakdownEntry[];
  byAssignee: BreakdownEntry[];
  countsByStatus: Record<PunchItemStatus, number>;
};

export type ProjectDto = {
  id: string;
  name: string;
  address: string | null;
  status: PunchItemStatus;
  createdAt: string;
  itemCount?: number;
  completionPercent?: number;
};

export type PunchItemDto = {
  id: string;
  projectId: string;
  location: string;
  description: string;
  status: PunchItemStatus;
  priority: Priority;
  assignedTo: string | null;
  photo: string | null;
  createdAt: string;
};

type ProjectWithPunchItems = {
  id: string;
  name: string;
  address: string | null;
  createdAt: Date;
  punchItems: Array<{ status: PunchItemStatus }>;
};

type PunchItemRecord = {
  id: string;
  projectId: string;
  location: string;
  description: string;
  status: PunchItemStatus;
  priority: Priority;
  assignedTo: string | null;
  photo: string | null;
  createdAt: Date;
};

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Invalid request", parsed.error.issues);
  }

  return parsed.data;
}

function mapPunchItem(record: PunchItemRecord): PunchItemDto {
  return {
    id: record.id,
    projectId: record.projectId,
    location: record.location,
    description: record.description,
    status: record.status,
    priority: record.priority,
    assignedTo: record.assignedTo,
    photo: record.photo,
    createdAt: record.createdAt.toISOString(),
  };
}

function summarizeProject(project: ProjectWithPunchItems): ProjectDto {
  const total = project.punchItems.length;
  const counts = project.punchItems.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      accumulator.total += 1;
      return accumulator;
    },
    { open: 0, in_progress: 0, complete: 0, total: 0 },
  );

  return {
    id: project.id,
    name: project.name,
    address: project.address,
    status: deriveProjectStatusFromCounts(counts),
    createdAt: project.createdAt.toISOString(),
    itemCount: total,
    completionPercent: calculateCompletionPercent(
      counts.complete,
      counts.total,
    ),
  };
}

function buildDashboardBreakdown(
  buckets: Array<{ label: string; count: number; completeCount: number }>,
): BreakdownEntry[] {
  return sortBreakdownEntries(
    buckets.map((bucket) => ({
      ...bucket,
      completionPercent: calculateCompletionPercent(
        bucket.completeCount,
        bucket.count,
      ),
    })),
  );
}

function normalizeDashboardCounts(
  countsByStatus: Partial<Record<PunchItemStatus, number>>,
): Record<PunchItemStatus, number> {
  return {
    open: countsByStatus.open ?? 0,
    in_progress: countsByStatus.in_progress ?? 0,
    complete: countsByStatus.complete ?? 0,
  };
}

export async function listProjects(
  client: PrismaClientLike = defaultPrisma,
): Promise<ProjectDto[]> {
  const projects = await client.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      punchItems: {
        select: { status: true },
      },
    },
  });

  return projects.map((project) => summarizeProject(project));
}

export async function createProject(
  input: unknown,
  client: PrismaClientLike = defaultPrisma,
): Promise<ProjectDto> {
  const parsed = parseInput(createProjectSchema, input);
  const project = await client.project.create({
    data: {
      name: parsed.name,
      address: parsed.address?.trim() ?? null,
    },
    include: {
      punchItems: {
        select: { status: true },
      },
    },
  });

  return summarizeProject(project);
}

export async function listPunchItems(
  projectId: string,
  client: PrismaClientLike = defaultPrisma,
): Promise<PunchItemDto[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const items = await client.punchItem.findMany({
    where: { projectId: parsedProjectId },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => mapPunchItem(item));
}

export async function createPunchItem(
  projectId: string,
  input: unknown,
  client: PrismaClientLike = defaultPrisma,
): Promise<PunchItemDto> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsed = parseInput(createPunchItemSchema, input);

  const project = await client.project.findUnique({
    where: { id: parsedProjectId },
    select: { id: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const created = await client.punchItem.create({
    data: {
      projectId: parsedProjectId,
      location: parsed.location,
      description: parsed.description,
      priority: parsed.priority ?? "normal",
      assignedTo: normalizeAssignedTo(parsed.assignedTo),
      photo: parsed.photo ?? null,
    },
  });

  return mapPunchItem(created);
}

export async function transitionPunchItemStatus(
  punchItemId: string,
  input: unknown,
  client: PrismaClientLike = defaultPrisma,
): Promise<PunchItemDto> {
  const parsedPunchItemId = punchItemIdSchema.parse(punchItemId);
  const parsed = parseInput(transitionPunchItemStatusSchema, input);

  return client.$transaction(async (transaction) => {
    const current = await transaction.punchItem.findUnique({
      where: { id: parsedPunchItemId },
      select: {
        id: true,
        projectId: true,
        location: true,
        description: true,
        status: true,
        priority: true,
        assignedTo: true,
        photo: true,
        createdAt: true,
      },
    });

    if (!current) {
      throw new NotFoundError("Punch item not found");
    }

    if (!isForwardTransition(current.status, parsed.status)) {
      throw new ConflictError(
        `Punch item status can only move forward from ${current.status} to ${parsed.status}`,
      );
    }

    const updated = await transaction.punchItem.update({
      where: { id: parsedPunchItemId },
      data: { status: parsed.status },
    });

    await transaction.punchItemStatusTransition.create({
      data: {
        punchItemId: parsedPunchItemId,
        fromStatus: current.status,
        toStatus: parsed.status,
        actor: parsed.actor ?? "system",
      },
    });

    return mapPunchItem(updated);
  });
}

export async function updatePunchItemAssignment(
  punchItemId: string,
  input: unknown,
  client: PrismaClientLike = defaultPrisma,
): Promise<PunchItemDto> {
  const parsedPunchItemId = punchItemIdSchema.parse(punchItemId);
  const parsed = parseInput(updatePunchItemAssignmentSchema, input);

  const existing = await client.punchItem.findUnique({
    where: { id: parsedPunchItemId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Punch item not found");
  }

  const updated = await client.punchItem.update({
    where: { id: parsedPunchItemId },
    data: {
      assignedTo: normalizeAssignedTo(parsed.assignedTo),
    },
  });

  return mapPunchItem(updated);
}

export async function updatePunchItemPhoto(
  punchItemId: string,
  input: unknown,
  client: PrismaClientLike = defaultPrisma,
): Promise<PunchItemDto> {
  const parsedPunchItemId = punchItemIdSchema.parse(punchItemId);
  const parsed = parseInput(updatePunchItemPhotoSchema, input);

  const existing = await client.punchItem.findUnique({
    where: { id: parsedPunchItemId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Punch item not found");
  }

  const updated = await client.punchItem.update({
    where: { id: parsedPunchItemId },
    data: {
      photo: parsed.photo,
    },
  });

  return mapPunchItem(updated);
}

export async function getProjectDashboardMetrics(
  projectId: string,
  client: PrismaClientLike = defaultPrisma,
): Promise<DashboardMetrics> {
  const parsedProjectId = projectIdSchema.parse(projectId);

  const project = await client.project.findUnique({
    where: { id: parsedProjectId },
    select: { id: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const items = await client.punchItem.findMany({
    where: { projectId: parsedProjectId },
    select: {
      status: true,
      location: true,
      priority: true,
      assignedTo: true,
    },
  });

  const countsByStatus = normalizeDashboardCounts(
    items.reduce(
      (accumulator, item) => {
        accumulator[item.status] += 1;
        return accumulator;
      },
      { open: 0, in_progress: 0, complete: 0 } as Record<
        PunchItemStatus,
        number
      >,
    ),
  );

  const totalItems = items.length;
  const completeCount = countsByStatus.complete;

  const locationMap = new Map<
    string,
    { label: string; count: number; completeCount: number }
  >();
  const priorityMap = new Map<
    Priority,
    { label: Priority; count: number; completeCount: number }
  >();
  const assigneeMap = new Map<
    string,
    { label: string; count: number; completeCount: number }
  >();

  for (const item of items) {
    const locationBucket = locationMap.get(item.location) ?? {
      label: item.location,
      count: 0,
      completeCount: 0,
    };

    locationBucket.count += 1;
    if (item.status === "complete") {
      locationBucket.completeCount += 1;
    }
    locationMap.set(item.location, locationBucket);

    const priorityBucket = priorityMap.get(item.priority) ?? {
      label: item.priority,
      count: 0,
      completeCount: 0,
    };

    priorityBucket.count += 1;
    if (item.status === "complete") {
      priorityBucket.completeCount += 1;
    }
    priorityMap.set(item.priority, priorityBucket);

    const assigneeLabel = item.assignedTo ?? "Unassigned";
    const assigneeBucket = assigneeMap.get(assigneeLabel) ?? {
      label: assigneeLabel,
      count: 0,
      completeCount: 0,
    };

    assigneeBucket.count += 1;
    if (item.status === "complete") {
      assigneeBucket.completeCount += 1;
    }
    assigneeMap.set(assigneeLabel, assigneeBucket);
  }

  const byLocation = buildDashboardBreakdown(Array.from(locationMap.values()));

  const byPriority = (priorityOrder as Priority[]).map((priority) => {
    const bucket = priorityMap.get(priority) ?? {
      label: priority,
      count: 0,
      completeCount: 0,
    };

    return {
      ...bucket,
      completionPercent: calculateCompletionPercent(
        bucket.completeCount,
        bucket.count,
      ),
    };
  });

  const byAssignee = buildDashboardBreakdown(Array.from(assigneeMap.values()));

  return {
    completionPercent: calculateCompletionPercent(completeCount, totalItems),
    byLocation,
    byPriority,
    byAssignee,
    countsByStatus,
  };
}

export { punchItemStatusOrder, priorityOrder };
