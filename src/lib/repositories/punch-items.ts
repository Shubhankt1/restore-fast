import type { PunchItem, PunchItemStatus, Priority } from "@prisma/client";

import { AppError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const punchItemStatusOrder: PunchItemStatus[] = [
  "open",
  "in_progress",
  "complete",
];

const punchItemPriorityOrder: Priority[] = ["low", "normal", "high"];

function isForwardTransition(
  current: PunchItemStatus,
  next: PunchItemStatus,
): boolean {
  const currentIndex = punchItemStatusOrder.indexOf(current);
  const nextIndex = punchItemStatusOrder.indexOf(next);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireProjectId(projectId: string): string {
  const trimmed = projectId.trim();

  if (!trimmed) {
    throw new AppError("Project id is required", 400, "BAD_REQUEST");
  }

  return trimmed;
}

export async function getPunchItem(id: string): Promise<PunchItem | null> {
  return prisma.punchItem.findUnique({ where: { id } });
}

export async function listItemsForProject(
  projectId: string,
): Promise<PunchItem[]> {
  return prisma.punchItem.findMany({
    where: { projectId: requireProjectId(projectId) },
    orderBy: { createdAt: "desc" },
  });
}

export async function listRecentItems(limit = 4): Promise<PunchItem[]> {
  return prisma.punchItem.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createPunchItem(input: {
  projectId: string;
  location: string;
  description: string;
  priority?: Priority | undefined;
  assignedTo?: string | null | undefined;
  photo?: string | null | undefined;
}): Promise<PunchItem> {
  const projectId = requireProjectId(input.projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const location =
    typeof input.location === "string" ? input.location.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  if (!location) {
    throw new AppError("Location is required", 400, "BAD_REQUEST");
  }

  if (!description) {
    throw new AppError("Description is required", 400, "BAD_REQUEST");
  }

  if (
    input.priority !== undefined &&
    !punchItemPriorityOrder.includes(input.priority as Priority)
  ) {
    throw new AppError("Choose a valid priority", 400, "BAD_REQUEST");
  }

  return prisma.punchItem.create({
    data: {
      projectId,
      location,
      description,
      priority: (input.priority as Priority | undefined) ?? "normal",
      assignedTo: normalizeOptionalText(input.assignedTo),
      photo: normalizeOptionalText(input.photo),
    },
  });
}

export async function updatePunchItemStatus(
  id: string,
  toStatus: PunchItemStatus,
  actor: string,
): Promise<PunchItem> {
  const punchItemId = id.trim();

  if (!punchItemId) {
    throw new AppError("Punch item id is required", 400, "BAD_REQUEST");
  }

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.punchItem.findUnique({
      where: { id: punchItemId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!current) {
      throw new NotFoundError("Punch item not found");
    }

    if (!isForwardTransition(current.status, toStatus)) {
      throw new AppError("Invalid status transition", 400, "BAD_REQUEST");
    }

    const updated = await transaction.punchItem.update({
      where: { id: punchItemId },
      data: { status: toStatus },
    });

    await transaction.punchItemStatusTransition.create({
      data: {
        punchItemId,
        fromStatus: current.status,
        toStatus,
        actor: normalizeOptionalText(actor) ?? "system",
      },
    });

    return updated;
  });
}

export async function updatePunchItemAssignment(
  id: string,
  assignedTo: string,
): Promise<PunchItem> {
  const punchItemId = id.trim();

  if (!punchItemId) {
    throw new AppError("Punch item id is required", 400, "BAD_REQUEST");
  }

  const current = await prisma.punchItem.findUnique({
    where: { id: punchItemId },
    select: { id: true },
  });

  if (!current) {
    throw new NotFoundError("Punch item not found");
  }

  const normalizedAssignedTo = normalizeOptionalText(assignedTo);

  if (normalizedAssignedTo === null) {
    throw new AppError("Assignment is required", 400, "BAD_REQUEST");
  }

  return prisma.punchItem.update({
    where: { id: punchItemId },
    data: {
      assignedTo: normalizedAssignedTo,
    },
  });
}

export async function updatePunchItemPhoto(
  id: string,
  photo: string | null,
): Promise<PunchItem> {
  const punchItemId = id.trim();

  if (!punchItemId) {
    throw new AppError("Punch item id is required", 400, "BAD_REQUEST");
  }

  const current = await prisma.punchItem.findUnique({
    where: { id: punchItemId },
    select: { id: true },
  });

  if (!current) {
    throw new NotFoundError("Punch item not found");
  }

  return prisma.punchItem.update({
    where: { id: punchItemId },
    data: {
      photo: normalizeOptionalText(photo),
    },
  });
}
