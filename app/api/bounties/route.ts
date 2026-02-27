import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { BountyStatus } from "@prisma/client";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const bounties = await prisma.bounty.findMany({
    where: { status: BountyStatus.ACTIVE },
    orderBy: { amount: "desc" },
  });
  return NextResponse.json(
    bounties.map((b) => ({
      id: b.id,
      targetRobloxUserId: b.targetRobloxUserId,
      targetUsername: null as string | null,
      amount: b.amount,
      createdAt: b.createdAt,
    }))
  );
}
