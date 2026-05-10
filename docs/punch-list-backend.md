# Punch List Backend Notes

## Environment

- `DATABASE_URL`: Supabase Postgres connection string used by Prisma.
- `DIRECT_URL`: Direct Postgres URL for Prisma migrations/introspection.
- `NEXT_PUBLIC_SUPABASE_URL`: Base Supabase project URL for the storage SDK client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by the storage SDK client.
- `SUPABASE_STORAGE_BUCKET`: Storage bucket name for punch-list photos.

## Workflow Constraint

Punch item status is a strict forward-only state machine:

- `open -> in_progress -> complete`
- No skipping states.
- No backwards transitions.
- No arbitrary strings.

Every transition is written to `PunchItemStatusTransition` with an actor and timestamp so the completion history stays auditable.

## Photo Upload Flow

The backend uses a server-side upload to Supabase Storage via `@supabase/supabase-js`.
The upload route accepts a `file` form field, stores the object in the configured bucket, and persists the public photo URL on `PunchItem.photo`.

The upload helper generates object paths as:

- `punch-items/{punchItemId}/{uuid}{ext}`

For v1, keep the bucket public so the saved URL stays stable.

## Data Model Notes

- Projects are multi-tenant at the data level from day one.
- `assignedTo` is free text for v1 and should become a `Worker` relation later.

## Repository Layer

- `src/lib/repositories/projects.ts` is the UI-facing source of truth for project reads and writes.
- `src/lib/repositories/punch-items.ts` is the UI-facing source of truth for punch-item reads and writes.
- `src/lib/punch-actions.ts` wraps repository calls, revalidates affected routes, and handles form-state errors.

## API Response Shape

Mutations return a predictable JSON envelope:

```json
{
  "data": {},
  "error": null
}
```

Validation and server errors return the same envelope with `data: null` and an `error` object that includes a stable `code` field.
