import { NextRequest, NextResponse } from "next/server";
import { requireRobloxPrivateKey } from "@/lib/postback-auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { optionalDiscordWebhook } from "@/lib/discord";
import { logEvent } from "@/lib/event-log";
import { normalizeHouseName } from "@/lib/house-name";
import {
  computeSuspicionOnParseFailure,
  checkParsedAmount,
  rejectSuspiciousPayload,
} from "@/lib/suspicion";
import { BountyStatus } from "@prisma/client";
import {
  activityPointsPostback,
  spendDrogonsPostback,
  lootChestsPostback,
  collectBountyPostback,
  playerCountPostback,
  fortLootChestsPostback,
  farmChestPostback,
  parsePostbackPayload,
} from "@/lib/validations";

const LARGE_SPEND_THRESHOLD = 5000;
const UNUSUALLY_HIGH_LOOT_THRESHOLD = 5000;
const POSTBACK_RATE_LIMIT_PER_MIN = 60;

async function addDrogons(robloxUserId: string, amount: number): Promise<void> {
  await prisma.playerBalance.upsert({
    where: { robloxUserId },
    create: { robloxUserId, drogonsBalance: BigInt(amount) },
    update: { drogonsBalance: { increment: BigInt(amount) } },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireRobloxPrivateKey(request);
  if (authError) return authError;

  if (!(await rateLimitByIp(request, POSTBACK_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { slug } = await params;
  const body = await request.json().catch(() => ({}));

  async function onParseFailure(slug: string, body: unknown, result: { success: false; response: NextResponse }) {
    const { score, reasons } = computeSuspicionOnParseFailure(slug, body);
    if (score > 0) return await rejectSuspiciousPayload(slug, body, score, reasons);
    return result.response;
  }

  try {
    if (slug.startsWith("activity-points")) {
      const result = parsePostbackPayload(activityPointsPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const { groupName, activityPoints } = result.data;
      const activitySuspicion = checkParsedAmount(slug, activityPoints);
      if (activitySuspicion) return await rejectSuspiciousPayload(slug, body, activitySuspicion.score, activitySuspicion.reasons);
      const houseName = normalizeHouseName(groupName);
      const house = await prisma.house.upsert({
        where: { name: houseName },
        create: { name: houseName },
        update: {},
      });
      await prisma.houseBalance.upsert({
        where: { houseId: house.id },
        create: { houseId: house.id, activityPoints },
        update: { activityPoints },
      });
      await logEvent("postback_activity_points", `House ${houseName} activity points`, { groupName: houseName, activityPoints });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("spend-drogons")) {
      const result = parsePostbackPayload(spendDrogonsPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const roblox_userid = String(result.data.roblox_userid);
      const { amount, reason } = result.data;
      const spendSuspicion = checkParsedAmount(slug, amount);
      if (spendSuspicion) return await rejectSuspiciousPayload(slug, body, spendSuspicion.score, spendSuspicion.reasons);
      const user = await prisma.user.findUnique({ where: { robloxUserId: roblox_userid } });
      if (!user) return NextResponse.json({ error: "User not registered" }, { status: 400 });
      const balance = await prisma.playerBalance.findUnique({ where: { robloxUserId: roblox_userid } });
      if (!balance || balance.drogonsBalance < BigInt(amount)) {
        return NextResponse.json({ error: "Insufficient Drogons" }, { status: 207 });
      }
      await prisma.playerBalance.update({
        where: { robloxUserId: roblox_userid },
        data: { drogonsBalance: { decrement: BigInt(amount) } },
      });
      await logEvent("spend_drogons", reason || undefined, { amount, reason }, user.id);
      if (amount >= LARGE_SPEND_THRESHOLD) {
        await optionalDiscordWebhook({ type: "large_purchase", userId: user.robloxUserId, username: user.robloxUsername, amount, reason });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("loot-chests")) {
      const result = parsePostbackPayload(lootChestsPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const roblox_userid = String(result.data.roblox_userid);
      const { amount } = result.data;
      const lootSuspicion = checkParsedAmount(slug, amount);
      if (lootSuspicion) return await rejectSuspiciousPayload(slug, body, lootSuspicion.score, lootSuspicion.reasons);
      const user = await prisma.user.findUnique({ where: { robloxUserId: roblox_userid } });
      if (!user) return NextResponse.json({ error: "User not registered" }, { status: 400 });
      await addDrogons(roblox_userid, amount);
      await logEvent("postback_loot_chests", undefined, { roblox_userid, amount });
      if (amount >= UNUSUALLY_HIGH_LOOT_THRESHOLD) {
        await optionalDiscordWebhook({ type: "suspicious", message: "Unusually high loot chest amount", details: { roblox_userid, amount } });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("collect-bounty")) {
      const result = parsePostbackPayload(collectBountyPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const target_roblox_userid = String(result.data.target_roblox_userid);
      const claimed_roblox_userid = String(result.data.claimed_roblox_userid);
      const { claimed_roblox_username } = result.data;
      const claimant = await prisma.user.findUnique({ where: { robloxUserId: claimed_roblox_userid } });
      if (!claimant) return NextResponse.json({ error: "Claimant not registered" }, { status: 400 });
      const bounty = await prisma.bounty.findFirst({
        where: { targetRobloxUserId: target_roblox_userid, status: BountyStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
      });
      if (!bounty) return NextResponse.json({ error: "Bounty already claimed or not found" }, { status: 208 });
      const now = new Date();
      await prisma.$transaction([
        prisma.bounty.update({
          where: { id: bounty.id },
          data: {
            status: BountyStatus.CLAIMED,
            claimedAt: now,
            claimedByRobloxUserId: claimed_roblox_userid,
            claimedByUsername: claimed_roblox_username,
          },
        }),
        prisma.playerBalance.updateMany({
          where: { robloxUserId: target_roblox_userid },
          data: { drogonsBalance: { decrement: BigInt(bounty.amount) } },
        }),
        prisma.playerBalance.upsert({
          where: { robloxUserId: claimed_roblox_userid },
          create: { robloxUserId: claimed_roblox_userid, drogonsBalance: BigInt(bounty.amount) },
          update: { drogonsBalance: { increment: BigInt(bounty.amount) } },
        }),
      ]);
      await logEvent("collect_bounty", `Bounty claimed by ${claimed_roblox_username}`, {
        targetRobloxUserId: target_roblox_userid,
        claimedBy: claimed_roblox_userid,
        amount: bounty.amount,
      });
      const targetUser = await prisma.user.findUnique({ where: { robloxUserId: target_roblox_userid }, select: { robloxUsername: true } });
      await optionalDiscordWebhook({
        type: "bounty_claimed",
        targetUserId: target_roblox_userid,
        targetUsername: targetUser?.robloxUsername ?? target_roblox_userid,
        claimedBy: claimed_roblox_username,
        amount: bounty.amount,
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("player-count")) {
      const result = parsePostbackPayload(playerCountPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const playerCount = result.data.playerCount;
      const countSuspicion = checkParsedAmount(slug, playerCount);
      if (countSuspicion) return await rejectSuspiciousPayload(slug, body, countSuspicion.score, countSuspicion.reasons);
      await prisma.playerCountSnapshot.create({ data: { playerCount } });
      await logEvent("postback_player_count", undefined, { playerCount });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("fort-loot-chests")) {
      const result = parsePostbackPayload(fortLootChestsPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const roblox_userid = String(result.data.roblox_userid);
      const { amount } = result.data;
      const fortSuspicion = checkParsedAmount(slug, amount);
      if (fortSuspicion) return await rejectSuspiciousPayload(slug, body, fortSuspicion.score, fortSuspicion.reasons);
      const user = await prisma.user.findUnique({ where: { robloxUserId: roblox_userid } });
      if (!user) return NextResponse.json({ error: "User not registered" }, { status: 400 });
      await addDrogons(roblox_userid, amount);
      await logEvent("postback_fort_loot_chests", undefined, { roblox_userid, amount });
      if (amount >= UNUSUALLY_HIGH_LOOT_THRESHOLD) {
        await optionalDiscordWebhook({ type: "suspicious", message: "Unusually high fort loot amount", details: { roblox_userid, amount } });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (slug.startsWith("farm-chest")) {
      const result = parsePostbackPayload(farmChestPostback, body);
      if (!result.success) return onParseFailure(slug, body, result);
      const roblox_userid = String(result.data.roblox_userid);
      const { amount } = result.data;
      const farmSuspicion = checkParsedAmount(slug, amount);
      if (farmSuspicion) return await rejectSuspiciousPayload(slug, body, farmSuspicion.score, farmSuspicion.reasons);
      const user = await prisma.user.findUnique({ where: { robloxUserId: roblox_userid } });
      if (!user) return NextResponse.json({ error: "User not registered" }, { status: 400 });
      await addDrogons(roblox_userid, amount);
      await logEvent("postback_farm_chest", undefined, { roblox_userid, amount });
      if (amount >= UNUSUALLY_HIGH_LOOT_THRESHOLD) {
        await optionalDiscordWebhook({ type: "suspicious", message: "Unusually high farm chest amount", details: { roblox_userid, amount } });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown postback type" }, { status: 404 });
  } catch (e) {
    console.error("Postback error:", e);
    await logEvent("postback_error", "Postback handler error", { slug, error: String(e) }).catch(() => {});
    await optionalDiscordWebhook({
      type: "suspicious",
      message: "Postback handler error",
      details: { slug, error: String(e) },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
