"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useActionState } from "react";
import type { MutationState, PunchItemStatus } from "@/lib/punch-contract";
import {
  createItemAction,
  createProjectAction,
  updateItemAssignmentAction,
  updateItemPhotoAction,
  updateItemStatusAction,
} from "@/lib/punch-actions";

const initialState: MutationState = { ok: false };

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-300">{message}</p>;
}

function ActionButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Working..." : children}
    </button>
  );
}

export function ProjectCreateForm() {
  const [state, action, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          Create project
        </h2>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
          New site
        </span>
      </div>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">
            Project name
          </span>
          <input
            name="name"
            placeholder="Lakehouse Final Walk"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
          />
          <FieldError message={state.fieldErrors?.name} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Address</span>
          <input
            name="address"
            placeholder="88 Harbor Road, Tampa, FL"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
          />
          <FieldError message={state.fieldErrors?.address} />
        </label>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <FieldError message={state.formError} />
        <ActionButton pending={pending}>Create project</ActionButton>
      </div>
    </form>
  );
}

export function ItemCreateForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(
    createItemAction.bind(null, projectId),
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          Create item
        </h2>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Punch entry
        </span>
      </div>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">Location</span>
          <input
            name="location"
            placeholder="Unit 4C / North wall"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
          />
          <FieldError message={state.fieldErrors?.location} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">
            Description
          </span>
          <textarea
            name="description"
            rows={4}
            placeholder="Describe the defect, finish issue, or closeout item."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
          />
          <FieldError message={state.fieldErrors?.description} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Priority</span>
            <select
              name="priority"
              defaultValue="normal"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <FieldError message={state.fieldErrors?.priority} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Assigned to
            </span>
            <input
              name="assignedTo"
              placeholder="Foreman / trade"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
            />
            <FieldError message={state.fieldErrors?.assignedTo} />
          </label>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <FieldError message={state.formError} />
        <ActionButton pending={pending}>Add item</ActionButton>
      </div>
    </form>
  );
}

export function ItemCreateModal({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
      >
        Add item
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close create item dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
              >
                Close
              </button>
            </div>
            <ItemCreateForm projectId={projectId} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ItemStatusForm({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: PunchItemStatus;
}) {
  const [state, action, pending] = useActionState(
    updateItemStatusAction.bind(null, itemId),
    initialState,
  );

  const nextStatus: PunchItemStatus | null =
    currentStatus === "open"
      ? "in_progress"
      : currentStatus === "in_progress"
        ? "complete"
        : null;

  if (!nextStatus) {
    return (
      <div className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]">
        This item is already complete.
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Status control
          </h3>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
          {currentStatus.replaceAll("_", " ")}
        </span>
      </div>
      <FieldError message={state.fieldErrors?.nextStatus} />
      <div className="mt-4">
        <input type="hidden" name="nextStatus" value={nextStatus} />
        <ActionButton pending={pending}>
          {nextStatus === "in_progress" ? "Mark in progress" : "Mark complete"}
        </ActionButton>
      </div>
    </form>
  );
}

export function ItemAssignmentForm({
  itemId,
  assignedTo,
}: {
  itemId: string;
  assignedTo: string;
}) {
  const [state, action, pending] = useActionState(
    updateItemAssignmentAction.bind(null, itemId),
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          Assignment
        </h3>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Current owner
        </span>
      </div>
      <label className="mt-4 grid gap-2">
        <span className="text-sm font-medium text-slate-200">Assigned to</span>
        <input
          name="assignedTo"
          defaultValue={assignedTo}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50"
        />
        <FieldError message={state.fieldErrors?.assignedTo} />
      </label>
      <div className="mt-5 flex items-center justify-between gap-3">
        <FieldError message={state.formError} />
        <ActionButton pending={pending}>Save assignment</ActionButton>
      </div>
    </form>
  );
}

export function ItemPhotoForm({
  itemId,
  currentPhoto,
}: {
  itemId: string;
  currentPhoto: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateItemPhotoAction.bind(null, itemId),
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-3xl border border-white/8 bg-slate-900/80 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          Photo
        </h3>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Upload or link
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {currentPhoto ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
            {currentPhoto.startsWith("http") ? (
              <div
                className="h-52 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${currentPhoto})` }}
                aria-label="Current punch item photo"
                role="img"
              />
            ) : (
              <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-slate-300">
                Attached file: {currentPhoto}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/4 px-6 text-center text-sm text-slate-400">
            No photo attached yet. Add a field photo or inspection image.
          </div>
        )}
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">
            Upload image
          </span>
          <input
            type="file"
            name="photoUpload"
            accept="image/*"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-950"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">
            Photo URL fallback
          </span>
          <input
            name="photoUrl"
            placeholder="https://..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <FieldError message={state.formError} />
        <ActionButton pending={pending}>Save photo</ActionButton>
      </div>
    </form>
  );
}
