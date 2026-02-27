import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { BountyStatus } from "@prisma/client";

const POSTBACK_FETCH_RATE_LIMIT_PER_MIN = 60;

/** Public fetch: bounties returns ACTIVE list; clothing returns items. No auth key required. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await rateLimitByIp(request, POSTBACK_FETCH_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { slug } = await params;

  if (slug.startsWith("bounties")) {
    const bounties = await prisma.bounty.findMany({
      where: { status: BountyStatus.ACTIVE },
      orderBy: { amount: "desc" },
    });
    return NextResponse.json(
      bounties.map((b) => ({
        target_roblox_userid: b.targetRobloxUserId,
        amount: b.amount,
      }))
    );
  }

  if (slug.startsWith("clothing")) {
    const clothing = await prisma.clothingItem.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(clothing);
  }

  return NextResponse.json({ error: "Unknown fetch type" }, { status: 404 });
}
