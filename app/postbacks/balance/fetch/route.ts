import { NextRequest, NextResponse } from "next/server";
import { requireRobloxPrivateKey } from "@/lib/postback-auth";
import { prisma } from "@/lib/db";

/**
 * GET /postbacks/balance/fetch
 *
 * Protected endpoint for the Roblox game to fetch a player's current Drogons balance.
 * This endpoint is protected so only the game server (with ROBLOX_PRIVATE_KEY) can read
 * balances — the backend is the single source of truth and we never expose the key to
 * the frontend or client.
 */
export async function GET(request: NextRequest) {
  // 1. Authentication: only allow requests that include the correct private key in query params
  const authError = requireRobloxPrivateKey(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const robloxUserIdParam = searchParams.get("roblox_userid");

  // 2. Validate roblox_userid: must be present and a valid positive integer
  if (robloxUserIdParam === null || robloxUserIdParam === "") {
    return NextResponse.json({ error: "Invalid roblox_userid" }, { status: 400 });
  }

  const parsed = Number(robloxUserIdParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NextResponse.json({ error: "Invalid roblox_userid" }, { status: 400 });
  }

  const robloxUserIdStr = String(parsed);

  try {
    // 3. Database: use upsert so we have a single code path for "get or create".
    // We use upsert (not findUnique + create) to avoid race conditions when the game
    // and other postbacks might create the same player concurrently.
    // We auto-create users so the Roblox game can ask for any player's balance
    // without the player having visited the web app first; the backend stays the
    // single source of truth and we initialize with 0 Drogons.
    const balance = await prisma.playerBalance.upsert({
      where: { robloxUserId: robloxUserIdStr },
      create: {
        robloxUserId: robloxUserIdStr,
        drogonsBalance: BigInt(0),
      },
      update: {},
    });

    // 4. Return format required by Roblox: roblox_userid as number, balance as number
    return NextResponse.json(
      {
        roblox_userid: parsed,
        balance: Number(balance.drogonsBalance),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[postbacks/balance/fetch]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
