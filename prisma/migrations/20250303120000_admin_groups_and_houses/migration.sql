-- CreateTable: Group (nametag groups for Roblox)
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "r" INTEGER NOT NULL,
    "g" INTEGER NOT NULL,
    "b" INTEGER NOT NULL,
    "minRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Group_groupName_key" ON "Group"("groupName");
CREATE INDEX "Group_groupId_idx" ON "Group"("groupId");

-- AlterTable House: add groupId, r, g, b, isActive, updatedAt
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "groupId" INTEGER;
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "r" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "g" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "b" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "House" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Drop NametagGroup if it exists (replaced by Group)
DROP TABLE IF EXISTS "NametagGroup";
