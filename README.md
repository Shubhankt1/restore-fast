# Punch List Tracker

Construction punch-list tracker with a forward-only status workflow. Built as a small, opinionated take on the closeout-tracking problem: deliberately narrow scope, deliberate enforcement of the workflow, deliberate cuts.

## What it does

- Create projects.
- Add punch items with location, description, priority, assignee, and optional photo.
- Enforce item status transitions: `open → in_progress → complete`. No skipping, no reversing, no arbitrary strings.
- Dashboard metrics on the project detail page: completion percent and breakdowns by location, priority, and assignee.
- Item detail view with assignment, status, and photo controls.
- Photo uploads to Supabase Storage with public URLs persisted on the item.

## The constraint I noticed in the brief

The provided schema modeled status as `String @default("open")` with the valid values listed in a code comment. The spec then described the workflow as `open → in_progress → complete`. That arrow is a state machine, not a dropdown.

As given, the schema allowed any string, allowed skipping `in_progress`, and allowed reversing from `complete` back to `open`. None of that is valid for a real punch list, where "who closed this defect and when" is a legal closeout artifact.

What I changed:

1. Promoted `status` to a Prisma enum (`PunchItemStatus`) so the type system and the database both reject invalid values. Same treatment for `priority`.
2. Centralized the transition logic in `src/lib/punchlist.ts`. Every status mutation flows through one validator that rejects skips and reversals.
3. Added a `PunchItemStatusTransition` table that records `fromStatus`, `toStatus`, `actor`, and `createdAt` for every transition. The audit log isn't surfaced in the UI yet, but the data is there for queries and for future "who closed this" features.

## What's built

- Prisma schema with typed enums (`PunchItemStatus`, `Priority`) and a transition audit table.
- Repository layer in `src/lib/repositories/` as the only place UI code touches Prisma.
- Server actions in `src/lib/punch-actions.ts` that wrap repository calls and revalidate routes.
- Domain logic in `src/lib/punchlist.ts` enforcing forward-only transitions and computing dashboard metrics.
- JSON API routes under `src/app/api/**` for projects, item status updates, item assignment updates, and photo URL updates.
- Supabase Storage helper using the anon key for uploads. See [DEVELOPER.md](./DEVELOPER.md) for the bucket and RLS policies the setup expects.
- UI routes for project list, project detail, and item detail, plus app shell with loading, not-found, and error states.

## Known limitations

- **No auth.** Anyone with the URL can create projects, mutate items, and upload photos. The transition log records an actor string but doesn't verify it. See "What I cut" below.
- **1 MB photo cap.** Photo uploads go through Next.js Server Actions, which have a 1 MB body limit. The UI surfaces a field-level error for larger files. The path forward is direct-to-Supabase uploads via presigned URLs from the client.
- **Free-text `assignedTo`.** Typo-prone with no autocomplete. Acceptable for v1 with one project; promote to a `Worker` table when there's a second project sharing a workforce.

## What I cut and why

The brief rewards a tight scope filter more than a long feature list. Things I considered and deliberately did not build:

- **Auth.** No user model, no login. The brief didn't require it and adding it doubled the scope. The path forward is Supabase Auth with RLS policies on `Project` and `PunchItem` scoped to project membership, plus tighter Storage policies replacing the current `to anon` with `to authenticated`.
- **Worker table.** `assignedTo` stays free text until there's a real reason for normalization. Promoting later is a one-table migration plus a foreign key.
- **Bulk operations.** A real superintendent walking a unit closes 15 items at once. Out of scope for v1, obvious v2.
- **Offline / PWA.** Construction sites have terrible signal. A production app would queue mutations locally and sync when connectivity returns.
- **Real-time updates.** Supabase has Realtime built in, but two crews on the same punch list at the same time isn't a v1 problem.
- **Notifications.** SMS to assignees on item creation, email digests, and so on. The Twilio integration is in the JD's stack list; adding it without a clear trigger would be the "overbuilt for what the user needs" anti-pattern called out in the brief.

## What's next, in order

1. Auth + per-project RLS.
2. Direct-to-Storage photo uploads via presigned URLs (removes the 1 MB cap).
3. Bulk close action on the project detail page.
4. Promote `assignedTo` to a `Worker` table.

## Local development

```bash
npm install
cp .env.example .env.local  # then fill in values
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Setup details (env vars, Supabase Storage bucket, RLS policies, why `DATABASE_URL` uses the pooler) are in [DEVELOPER.md](./DEVELOPER.md).

## Quality checks

```bash
npm run test
npm run lint
```
