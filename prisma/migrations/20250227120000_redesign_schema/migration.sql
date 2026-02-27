-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClothingType" AS ENUM ('SHIRT', 'PANTS', 'FULL', 'ACCESSORY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "robloxUserId" TEXT NOT NULL,
    "robloxUsername" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerBalance" (
    "robloxUserId" TEXT NOT NULL,
    "drogonsBalance" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseBalance" (
    "houseId" TEXT NOT NULL,
    "drogonsBalance" BIGINT NOT NULL DEFAULT 0,
    "activityPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Bounty" (
    "id" TEXT NOT NULL,
    "targetRobloxUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "BountyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "claimedByRobloxUserId" TEXT,
    "claimedByUsername" TEXT,

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCountSnapshot" (
    "id" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClothingItem" (
    "id" TEXT NOT NULL,
    "clothingName" TEXT NOT NULL,
    "clothingType" "ClothingType" NOT NULL,
    "shirtID" INTEGER,
    "pantsID" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClothingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomyAd" (
    "id" TEXT NOT NULL,
    "groupID" INTEGER,
    "groupName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomyAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_robloxUserId_key" ON "User"("robloxUserId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerBalance_robloxUserId_key" ON "PlayerBalance"("robloxUserId");

-- CreateIndex
CREATE INDEX "PlayerBalance_drogonsBalance_idx" ON "PlayerBalance"("drogonsBalance" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "House_name_key" ON "House"("name");

-- CreateIndex
CREATE INDEX "House_name_idx" ON "House"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HouseBalance_houseId_key" ON "HouseBalance"("houseId");

-- CreateIndex
CREATE INDEX "HouseBalance_drogonsBalance_idx" ON "HouseBalance"("drogonsBalance" DESC);

-- CreateIndex
CREATE INDEX "HouseBalance_activityPoints_idx" ON "HouseBalance"("activityPoints" DESC);

-- CreateIndex
CREATE INDEX "Bounty_status_idx" ON "Bounty"("status");

-- CreateIndex
CREATE INDEX "Bounty_status_amount_idx" ON "Bounty"("status", "amount" DESC);

-- CreateIndex
CREATE INDEX "Bounty_targetRobloxUserId_idx" ON "Bounty"("targetRobloxUserId");

-- CreateIndex
CREATE INDEX "Bounty_createdAt_idx" ON "Bounty"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlayerCountSnapshot_createdAt_idx" ON "PlayerCountSnapshot"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "EventLog_type_idx" ON "EventLog"("type");

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "EventLog_userId_idx" ON "EventLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClothingItem_clothingName_key" ON "ClothingItem"("clothingName");

-- CreateIndex
CREATE INDEX "ClothingItem_clothingType_idx" ON "ClothingItem"("clothingType");

-- AddForeignKey
ALTER TABLE "PlayerBalance" ADD CONSTRAINT "PlayerBalance_robloxUserId_fkey" FOREIGN KEY ("robloxUserId") REFERENCES "User"("robloxUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseBalance" ADD CONSTRAINT "HouseBalance_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
