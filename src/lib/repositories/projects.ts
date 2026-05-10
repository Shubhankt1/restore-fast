import { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export type ProjectWithItemStatuses = Prisma.ProjectGetPayload<{
  include: {
    punchItems: {
      select: {
        status: true;
      };
    };
  };
}>;

function requireProjectName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new AppError("Project name is required", 400, "BAD_REQUEST");
  }

  return trimmed;
}

export async function listProjects(): Promise<ProjectWithItemStatuses[]> {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      punchItems: {
        select: {
          status: true,
        },
      },
    },
  });
}

export async function getProject(
  id: string,
): Promise<ProjectWithItemStatuses | null> {
  return prisma.project.findUnique({
    where: { id },
    include: {
      punchItems: {
        select: {
          status: true,
        },
      },
    },
  });
}

export async function createProject(
  input: Prisma.ProjectCreateInput,
): Promise<ProjectWithItemStatuses> {
  const name = requireProjectName(input.name);
  const address =
    typeof input.address === "string" ? input.address.trim() : input.address;

  if (typeof address === "string" && !address) {
    throw new AppError("Project address is required", 400, "BAD_REQUEST");
  }

  return prisma.project.create({
    data: {
      name,
      address: address ?? null,
    },
    include: {
      punchItems: {
        select: {
          status: true,
        },
      },
    },
  });
}
