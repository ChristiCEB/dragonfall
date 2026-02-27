import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { bigIntToNumber } from "@/lib/bigint";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ robloxUserId: string }> }
) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { robloxUserId } = await params;
  const user = await prisma.user.findUnique({
    where: { robloxUserId },
    include: { balance: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: user.id,
    robloxUserId: user.robloxUserId,
    username: user.robloxUsername,
    displayName: user.robloxUsername,
    avatarUrl: user.avatarUrl,
    drogons: user.balance ? bigIntToNumber(user.balance.drogonsBalance) : 0,
    houseName: null,
    createdAt: user.createdAt,
  });
}
