import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { z } from "zod";

const MAX_CHEST_AMOUNT = 10000;

const chestBodySchema = z.object({
  roblox_userid: z.number().int().min(1),
  amount: z.number().int().min(1),
  position: z.string().optional(),
});

export type ChestSource = "fort_loot_chest" | "random_loot_chest";

export type AddDrogonsResult =
  | { success: true; roblox_userid: number; balance: number; added: number }
  | { success: false; response: NextResponse };

/**
 * Validate chest postback body and add Drogons to PlayerBalance.
 * Uses upsert (create with balance = 0 if missing, then add amount).
 * Rejects amount > 10000. Logs to EventLog. Returns result or error response.
 */
export async function addDrogonsForChest(
  body: unknown,
  source: ChestSource
): Promise<AddDrogonsResult> {
  const parsed = chestBodySchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }

  const { roblox_userid, amount, position } = parsed.data;

  if (amount > MAX_CHEST_AMOUNT) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Amount exceeds maximum (${MAX_CHEST_AMOUNT})` },
        { status: 400 }
      ),
    };
  }

  const robloxUserIdStr = String(roblox_userid);

  try {
    await prisma.playerBalance.upsert({
      where: { robloxUserId: robloxUserIdStr },
      create: { robloxUserId: robloxUserIdStr, drogonsBalance: BigInt(amount) },
      update: { drogonsBalance: { increment: BigInt(amount) } },
    });
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (code === "P2003") {
      return {
        success: false,
        response: NextResponse.json(
          { error: "User not registered" },
          { status: 400 }
        ),
      };
    }
    throw err;
  }

  const updated = await prisma.playerBalance.findUnique({
    where: { robloxUserId: robloxUserIdStr },
    select: { drogonsBalance: true },
  });

  const balance = updated ? Number(updated.drogonsBalance) : amount;

  await logEvent(
    "chest_loot",
    `${source}: ${amount} Drogons`,
    {
      roblox_userid,
      amount,
      source,
      ...(position !== undefined && { position }),
      timestamp: new Date().toISOString(),
    },
    null
  );

  return {
    success: true,
    roblox_userid,
    balance,
    added: amount,
  };
}
