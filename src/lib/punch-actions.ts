"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import type {
  MutationState,
  PunchItemPriority,
  PunchItemStatus,
} from "@/lib/punch-contract";
import { createProject } from "@/lib/repositories/projects";
import {
  createPunchItem,
  updatePunchItemStatus,
  updatePunchItemAssignment,
  updatePunchItemPhoto,
} from "@/lib/repositories/punch-items";
import { uploadPunchItemPhoto } from "@/lib/supabase-storage";
function getString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function mutationStateFromError(
  error: unknown,
  fieldName?: string,
): MutationState {
  if (error instanceof AppError) {
    if (error.status === 413) {
      if (fieldName) {
        return {
          ok: false,
          fieldErrors: {
            [fieldName]: "File too large — upload must be under 1 MB.",
          },
        };
      }

      return {
        ok: false,
        formError: "File too large — upload must be under 1 MB.",
      };
    }

    if (fieldName && error.code === "BAD_REQUEST") {
      return { ok: false, fieldErrors: { [fieldName]: error.message } };
    }

    return { ok: false, formError: error.message };
  }

  const anyErr = error as unknown as {
    statusCode?: number;
    status?: number;
    message?: unknown;
  };
  if (
    anyErr?.statusCode === 413 ||
    anyErr?.status === 413 ||
    (typeof anyErr?.message === "string" &&
      anyErr.message.includes("Body exceeded"))
  ) {
    if (fieldName) {
      return {
        ok: false,
        fieldErrors: {
          [fieldName]: "File too large — upload must be under 1 MB.",
        },
      };
    }

    return {
      ok: false,
      formError: "File too large — upload must be under 1 MB.",
    };
  }

  return {
    ok: false,
    formError: "An unexpected error occurred",
  };
}

const MAX_UPLOAD_BYTES = 1_000_000;

const defaultState: MutationState = { ok: true };

/**
 * Detect and re-throw Next.js navigation errors (redirect, notFound, etc.)
 * so they aren't caught as regular application errors.
 */
function isNextNavigationError(error: unknown): boolean {
  if (error instanceof Error) {
    const digest = (error as { digest?: string }).digest;
    if (typeof digest === "string") {
      return (
        digest.startsWith("NEXT_REDIRECT") ||
        digest.startsWith("NEXT_NOT_FOUND")
      );
    }
  }
  return false;
}

export async function createProjectAction(
  _state: MutationState = defaultState,
  formData: FormData,
): Promise<MutationState> {
  void _state;

  const name = getString(formData, "name").trim();
  const address = getString(formData, "address").trim();

  if (!name) {
    return { ok: false, fieldErrors: { name: "Project name is required." } };
  }

  if (!address) {
    return {
      ok: false,
      fieldErrors: { address: "Project address is required." },
    };
  }

  const project = await createProject({ name, address });

  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function createItemAction(
  projectId: string,
  _state: MutationState = defaultState,
  formData: FormData,
): Promise<MutationState> {
  void _state;

  const location = getString(formData, "location").trim();
  const description = getString(formData, "description").trim();
  const priority = getString(formData, "priority") as PunchItemPriority;
  const assignedTo = getString(formData, "assignedTo").trim();

  if (!location) {
    return { ok: false, fieldErrors: { location: "Location is required." } };
  }

  if (!description) {
    return {
      ok: false,
      fieldErrors: { description: "Description is required." },
    };
  }

  if (!priority) {
    return { ok: false, fieldErrors: { priority: "Choose a valid priority." } };
  }

  if (!["low", "normal", "high"].includes(priority)) {
    return { ok: false, fieldErrors: { priority: "Choose a valid priority." } };
  }

  await createPunchItem({
    projectId,
    location,
    description,
    priority,
    assignedTo: assignedTo || null,
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function updateItemStatusAction(
  itemId: string,
  _state: MutationState = defaultState,
  formData: FormData,
): Promise<MutationState> {
  void _state;

  const nextStatus = getString(formData, "nextStatus") as PunchItemStatus;

  if (!nextStatus) {
    return {
      ok: false,
      fieldErrors: { nextStatus: "Status is required." },
    };
  }

  try {
    const punchItem = await updatePunchItemStatus(itemId, nextStatus, "system");

    revalidatePath("/");
    revalidatePath(`/projects/${punchItem.projectId}`);
    revalidatePath(`/items/${itemId}`);
    redirect(`/items/${itemId}`);
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return mutationStateFromError(error, "nextStatus");
  }
}

export async function updateItemAssignmentAction(
  itemId: string,
  _state: MutationState = defaultState,
  formData: FormData,
): Promise<MutationState> {
  void _state;

  const assignedTo = getString(formData, "assignedTo").trim();

  if (!assignedTo) {
    return {
      ok: false,
      fieldErrors: { assignedTo: "Assignment is required." },
    };
  }

  try {
    const punchItem = await updatePunchItemAssignment(itemId, assignedTo);

    revalidatePath("/");
    revalidatePath(`/projects/${punchItem.projectId}`);
    revalidatePath(`/items/${itemId}`);
    redirect(`/items/${itemId}`);
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    console.error("Error updating assignment:", error);
    return mutationStateFromError(error, "assignedTo");
  }
}

export async function updateItemPhotoAction(
  itemId: string,
  _state: MutationState = defaultState,
  formData: FormData,
): Promise<MutationState> {
  void _state;

  const url = getString(formData, "photoUrl");
  const upload = formData.get("photoUpload");

  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        fieldErrors: {
          photoUrl: `File too large — upload must be under ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB.`,
        },
      };
    }
    try {
      const photoUrl = await uploadPunchItemPhoto({
        punchItemId: itemId,
        file: upload,
      });

      const punchItem = await updatePunchItemPhoto(itemId, photoUrl);

      revalidatePath("/");
      revalidatePath(`/projects/${punchItem.projectId}`);
      revalidatePath(`/items/${itemId}`);
      redirect(`/items/${itemId}`);
    } catch (error) {
      if (isNextNavigationError(error)) {
        throw error;
      }
      console.error("Error uploading photo:", error);
      return mutationStateFromError(error, "photoUrl");
    }
  }

  if (!url) {
    return {
      ok: false,
      fieldErrors: { photoUrl: "Provide a photo URL or upload a file." },
    };
  }

  try {
    const punchItem = await updatePunchItemPhoto(itemId, url);

    revalidatePath("/");
    revalidatePath(`/projects/${punchItem.projectId}`);
    revalidatePath(`/items/${itemId}`);
    redirect(`/items/${itemId}`);
  } catch (error) {
    if (isNextNavigationError(error)) {
      throw error;
    }
    return mutationStateFromError(error, "photoUrl");
  }
}
