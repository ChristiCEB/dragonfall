-- Add credentials columns to User (nullable first for backfill)
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Backfill username for existing rows (unique per user)
UPDATE "User" SET "username" = 'roblox_' || "robloxUserId" WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "User" ALTER COLUMN "robloxUserId" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "robloxUsername" DROP NOT NULL;
