import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";

export async function GET() {
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
    .sort((a, b) => b.activityPoints - a.activityPoints || b.totalDrogons - a.totalDrogons);
  return NextResponse.json(withBalance);
}
