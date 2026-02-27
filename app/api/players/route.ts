import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { bigIntToNumber } from "@/lib/bigint";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const users = await prisma.user.findMany({
    include: { balance: true },
    take: 500,
  });
  const players = users
    .map((u) => ({
      id: u.id,
      robloxUserId: u.robloxUserId,
      username: u.robloxUsername,
      displayName: u.robloxUsername,
      avatarUrl: u.avatarUrl,
      drogons: u.balance ? bigIntToNumber(u.balance.drogonsBalance) : 0,
      houseName: null as string | null,
    }))
    .sort((a, b) => b.drogons - a.drogons);
  return NextResponse.json(players);
}
