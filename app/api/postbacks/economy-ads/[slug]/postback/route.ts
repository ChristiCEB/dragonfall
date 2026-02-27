import { NextRequest, NextResponse } from "next/server";
import { requireRobloxPrivateKey } from "@/lib/postback-auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const POSTBACK_RATE_LIMIT_PER_MIN = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireRobloxPrivateKey(request);
  if (authError) return authError;

  if (!(await rateLimitByIp(request, POSTBACK_RATE_LIMIT_PER_MIN))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const ad = await prisma.economyAd.findFirst({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({
    groupID: ad?.groupID ?? null,
    groupName: ad?.groupName ?? null,
  });
}
