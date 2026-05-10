# Developer Notes

Internal reference for working on the punch list tracker. For project overview and setup, see [README.md](./README.md).

## Environment variables

| Variable                        | Purpose                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                  | Pooled Postgres connection (port 6543). **Must include `?pgbouncer=true&connection_limit=1`** so Prisma disables prepared statements for compatibility with PgBouncer transaction pooling. This is the connection used by the running app. |
| `DIRECT_URL`                    | Direct Postgres connection (port 5432). Used only by `prisma migrate` and `prisma db pull` because migrations require session-level features the pooler doesn't support.                                                                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL, used by the storage SDK client.                                                                                                                                                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT, used by the storage SDK client. Use the legacy `anon public` JWT (starts with `eyJ`), not a `sb_publishable_` opaque token, since the storage RLS policies bind to the `anon` role.                                     |
| `SUPABASE_STORAGE_BUCKET`       | Storage bucket name for punch-item photos. Default: `punch-photos`.                                                                                                                                                                        |

### Why two database URLs

App runtime uses the pooler so serverless cold starts on Vercel don't blow through Supabase's connection cap. PgBouncer in transaction mode recycles connections between transactions, which breaks Prisma's prepared statement caching — `?pgbouncer=true` tells Prisma to disable them. The microsecond cost is irrelevant; the ability to scale on serverless is not.

Migrations need a real direct connection because `prisma migrate` uses session-scoped features (advisory locks, schema introspection) that don't survive connection recycling.

The Prisma client in `src/lib/prisma.ts` reads `DATABASE_URL` as-is. The flags above are appended to the env value, not added in code.

## Supabase Storage setup

After creating the Supabase project:

1. Dashboard → Storage → New bucket. Name: `punch-photos`. Public bucket: on. Save.
2. Dashboard → SQL Editor. Run:

```sql
CREATE POLICY "anon insert punch-photos"
ON storage.objects FOR INSERT
TO anon, service_role
WITH CHECK (bucket_id = 'punch-photos');

CREATE POLICY "anon select punch-photos"
ON storage.objects FOR SELECT
TO anon, service_role
USING (bucket_id = 'punch-photos');
```

Both policies are required. The Supabase JS SDK issues a SELECT against `storage.objects` as part of an upload (existence check and post-insert metadata read), so an INSERT-only policy fails with a misleading `new row violates row-level security policy` error.

The bucket's `public` flag covers anonymous reads of the actual file bytes via the `/storage/v1/object/public/...` URL path. It does not grant SELECT on the `storage.objects` table itself, which is what RLS evaluates during SDK calls.

## Workflow constraint

Punch item status is a strict forward-only state machine, enforced in `src/lib/punchlist.ts`:

- `open → in_progress → complete`
- No skipping states.
- No backwards transitions.
- No arbitrary strings (the field is the `PunchItemStatus` enum at the DB level).

Every transition writes a row to `PunchItemStatusTransition` with `fromStatus` (nullable for the initial create), `toStatus`, `actor`, and `createdAt`. The audit log is queryable but not currently surfaced in the UI; the dashboard's completion percentage is computed from the live `PunchItem.status` values, not the log.

## Photo upload flow

Server-side upload via `@supabase/supabase-js` from `src/lib/supabase-storage.ts`. Uses the anon key, not the service role key, so the credential matches the trust level (anyone with the app can upload, scoped by RLS to the `punch-photos` bucket).

Object path: `punch-items/{punchItemId}/{uuid}{ext}`. UUID alone is unique; no timestamp prefix needed.

The item detail page accepts either a file upload or a public URL fallback, then persists the resolved public URL on `PunchItem.photo`.

**1 MB cap.** Server Actions impose a 1 MB request body limit. The UI shows a field-level error on larger files. To remove the cap, the next iteration would issue a presigned upload URL from the server and have the client `PUT` directly to Supabase Storage, bypassing the action body.

## Architecture

### Repository layer

`src/lib/repositories/` is the only place UI code touches Prisma. Two files:

- `projects.ts` — `listProjects`, `getProject(id)`, `createProject(input)`
- `punch-items.ts` — `getPunchItem(id)`, `createPunchItem(input)`, `updatePunchItemStatus(id, toStatus, actor)`, `listItemsForProject(projectId)`, `listRecentItems(limit)`

Server actions in `src/lib/punch-actions.ts` call repository functions, never Prisma directly, and call `revalidatePath` after mutations.

### Domain logic

`src/lib/punchlist.ts` holds the transition validator and the dashboard metric helpers (completion percent, breakdowns by location, priority, assignee). Both the repository layer (UI) and the API route handlers (programmatic access) call into it. Single source of truth for the state machine and the aggregations.

### Data model

- `Project` — id, name, address, timestamps.
- `PunchItem` — id, projectId (FK with cascade), location, description, status (enum), priority (enum), assignedTo (nullable string), photo (nullable string), timestamps.
- `PunchItemStatusTransition` — id, punchItemId (FK with cascade), fromStatus (nullable enum), toStatus (enum), actor (string), createdAt.

Indexes on `PunchItem`: `(projectId, status)`, `(projectId, location)`, `(projectId, priority)`, `(projectId, assignedTo)` — composite, leading with `projectId` because every dashboard query scopes to a single project.

`assignedTo` is denormalized free text in v1. Promotion to a `Worker` foreign key is a v2 concern and makes the existing `(projectId, assignedTo)` index more valuable.

## Routes

### UI

| Path             | Purpose                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Project dashboard, recent work overview, create-project form.                                                                                             |
| `/projects/[id]` | Project detail, breakdown cards, item list, modal item creation. Metrics are computed inline by calling `src/lib/punchlist.ts` from the server component. |
| `/items/[id]`    | Punch item detail with status, assignment, and photo controls.                                                                                            |

### API

JSON route handlers under `src/app/api/**` cover projects, items, status updates, assignment updates, and photo URL updates. Dashboard metrics are not exposed as a dedicated endpoint — they're rendered inline on the project detail page.

## API response shape

Mutations return a consistent envelope:

```json
{
  "data": { "id": "9f1c...", "status": "in_progress" },
  "error": null
}
```

On error:

```json
{
  "data": null,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition from complete back to open"
  }
}
```

`error.code` is stable and safe to switch on. Common codes: `BAD_REQUEST`, `NOT_FOUND`, `INVALID_TRANSITION`, `INTERNAL_ERROR`.

## Operational notes

- Storage uploads use the anon key intentionally. Do not swap in a service role key for browser-facing flows — the service role bypasses all RLS, which is wrong for an unauthenticated upload path.
- The schema supports multiple projects from day one, but there's no tenancy or access control. Anyone with the URL can read or mutate anything. Auth + per-project RLS is the next architectural step (see README "What's next").
