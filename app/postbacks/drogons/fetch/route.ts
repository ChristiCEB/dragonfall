import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const POSTBACK_FETCH_RATE_LIMIT_PER_MIN = 60;

/**
 * GET /postbacks/drogons/fetch
 *
 * Public fetch: returns all player balances. No auth key required.
 * Used when the game needs a bulk list (e.g. legacy compatibility or leaderboard).
 */
export async function GET(request: NextRequest) {
  if (!(await rateLimitByIp(request, POSTBACK_FETCH_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const records = await prisma.playerBalance.findMany({
      select: { robloxUserId: true, drogonsBalance: true },
    });

    const payload = records.map((r) => ({
      roblox_userid: Number(r.robloxUserId),
      balance: Number(r.drogonsBalance),
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error("[postbacks/drogons/fetch]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
