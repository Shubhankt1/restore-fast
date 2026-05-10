CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "PunchItemStatus" AS ENUM ('open', 'in_progress', 'complete');
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high');

CREATE TABLE "Project" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PunchItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PunchItemStatus" NOT NULL DEFAULT 'open',
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "assignedTo" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PunchItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PunchItemStatusTransition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "punchItemId" UUID NOT NULL,
    "fromStatus" "PunchItemStatus",
    "toStatus" "PunchItemStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PunchItemStatusTransition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX "PunchItem_projectId_status_idx" ON "PunchItem"("projectId", "status");
CREATE INDEX "PunchItem_projectId_location_idx" ON "PunchItem"("projectId", "location");
CREATE INDEX "PunchItem_projectId_priority_idx" ON "PunchItem"("projectId", "priority");
CREATE INDEX "PunchItem_projectId_assignedTo_idx" ON "PunchItem"("projectId", "assignedTo");
CREATE INDEX "PunchItem_createdAt_idx" ON "PunchItem"("createdAt");
CREATE INDEX "PunchItemStatusTransition_punchItemId_createdAt_idx" ON "PunchItemStatusTransition"("punchItemId", "createdAt");

ALTER TABLE "PunchItem"
  ADD CONSTRAINT "PunchItem_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PunchItemStatusTransition"
  ADD CONSTRAINT "PunchItemStatusTransition_punchItemId_fkey"
  FOREIGN KEY ("punchItemId") REFERENCES "PunchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;