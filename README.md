# Punch List Tracker

Construction punch-list tracker with a forward-only status workflow.

## What this project solves

- Create projects.
- Add punch items with location, description, priority, assignee, and optional photo.
- Enforce item status transitions: `open -> in_progress -> complete`.
- Show dashboard metrics: completion percent, grouped by location, priority, and assignee.
- Upload punch-item photos to Supabase Storage and persist public URLs.

## Current implementation status

### Done

- Prisma schema with typed enums and transition audit table:
  - `PunchItemStatus` enum: `open`, `in_progress`, `complete`
  - `Priority` enum: `low`, `normal`, `high`
  - `PunchItemStatusTransition` for actor/timestamped history
- Prisma-backed repository layer in `src/lib/repositories/` is now the source of truth for UI reads and writes.
- Backend domain logic in `src/lib/punchlist.ts` still powers the API routes and enforces forward-only transitions.
- API routes for projects, items, status updates, assignment updates, dashboard metrics, and photo upload.
- Supabase Storage helper uses `@supabase/supabase-js` with anon key for upload/public URL generation.
- UI routes exist for project list, project detail, and item detail.

### Remaining (important)

- No live deployment URL is documented yet.

## Architecture snapshot

- UI pages:
  - `src/app/page.tsx`
  - `src/app/projects/[id]/page.tsx`
  - `src/app/items/[id]/page.tsx`
- Prisma-backed repository layer:
  - `src/lib/repositories/projects.ts`
  - `src/lib/repositories/punch-items.ts`
- Server actions and mutation glue:
  - `src/lib/punch-actions.ts`
- Database-backed backend:
  - `prisma/schema.prisma`
  - `src/lib/punchlist.ts`
  - `app/api/**`

## Environment variables

Copy `.env.example` to `.env.local` and fill in values:

- `DATABASE_URL`: Postgres connection string for Prisma runtime.
- `DIRECT_URL`: Direct Postgres connection for Prisma migrate/introspection.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by storage helper.
- `SUPABASE_STORAGE_BUCKET`: Supabase bucket for punch-item images.

## Local development

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Quality checks

```bash
npm run test
npm run lint
```

## Suggested next steps

- Add deployment and publish the live URL.
- Add production auth + RLS for project-level access control.
