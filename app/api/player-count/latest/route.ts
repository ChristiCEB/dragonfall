import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const latest = await prisma.playerCountSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    count: latest?.playerCount ?? 0,
    recordedAt: latest?.createdAt ?? null,
  });
}
