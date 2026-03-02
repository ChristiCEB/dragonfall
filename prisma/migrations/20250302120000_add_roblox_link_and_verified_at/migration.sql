-- CreateEnum
CREATE TYPE "RobloxLinkStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "robloxVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RobloxLinkRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "robloxUserId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RobloxLinkStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RobloxLinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RobloxLinkRequest_code_key" ON "RobloxLinkRequest"("code");

-- CreateIndex
CREATE INDEX "RobloxLinkRequest_userId_idx" ON "RobloxLinkRequest"("userId");

-- CreateIndex
CREATE INDEX "RobloxLinkRequest_code_idx" ON "RobloxLinkRequest"("code");

-- CreateIndex
CREATE INDEX "RobloxLinkRequest_status_idx" ON "RobloxLinkRequest"("status");

-- CreateIndex
CREATE INDEX "RobloxLinkRequest_expiresAt_idx" ON "RobloxLinkRequest"("expiresAt");

-- AddForeignKey
ALTER TABLE "RobloxLinkRequest" ADD CONSTRAINT "RobloxLinkRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
