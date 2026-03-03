import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const POSTBACK_FETCH_RATE_LIMIT_PER_MIN = 60;

/**
 * GET /postbacks/groups/fetch
 *
 * Public fetch for Roblox nametag script. Returns list of groups configured by admin
 * for nametag display. No auth key required (same as bounties/clothing fetch).
 */
export async function GET(request: NextRequest) {
  if (!(await rateLimitByIp(request, POSTBACK_FETCH_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const groups = await prisma.nametagGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const payload = groups.map((g) => ({
      groupName: g.groupName,
      groupId: g.groupId,
      groupColor: g.groupColor,
      ...(g.minRank != null && { minRank: g.minRank }),
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error("[postbacks/groups/fetch]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
