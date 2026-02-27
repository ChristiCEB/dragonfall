import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const houses = await prisma.house.findMany({
    include: { balance: true },
    orderBy: { name: "asc" },
  });
  const withBalance = houses
    .map((h) => ({
      id: h.id,
      name: h.name,
      totalDrogons: h.balance ? bigIntToNumber(h.balance.drogonsBalance) : 0,
      activityPoints: h.balance?.activityPoints ?? 0,
      updatedAt: h.balance?.updatedAt ?? null,
    }))
    .sort((a, b) => b.totalDrogons - a.totalDrogons || b.activityPoints - a.activityPoints);
  return NextResponse.json(withBalance);
}
