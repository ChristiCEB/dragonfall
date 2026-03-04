import { NextRequest, NextResponse } from "next/server";
import { requireRobloxPrivateKey } from "@/lib/postback-auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { addDrogonsForChest } from "@/lib/economy/addDrogons";

const POSTBACK_RATE_LIMIT_PER_MIN = 60;

/**
 * POST /postbacks/fort-loot-chests-2G74JF9320PY/postback
 *
 * Chest postback: add Drogons from fort loot chest. Body: { roblox_userid, amount, position? }
 * Requires ?key=ROBLOX_PRIVATE_KEY. Logs to EventLog with source "fort_loot_chest".
 */
export async function POST(request: NextRequest) {
  const authError = requireRobloxPrivateKey(request);
  if (authError) return authError;

  if (!(await rateLimitByIp(request, POSTBACK_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await addDrogonsForChest(body, "fort_loot_chest");

  if (!result.success) {
    return result.response;
  }

  return NextResponse.json(
    {
      roblox_userid: result.roblox_userid,
      balance: result.balance,
      added: result.added,
    },
    { status: 200 }
  );
}
