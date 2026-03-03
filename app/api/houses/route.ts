import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";
import { displayHouseName } from "@/lib/house-name";

export async function GET() {
  const houses = await prisma.house.findMany({
    where: { isActive: true },
    include: { balance: true },
    orderBy: { name: "asc" },
  });
  const withBalance = houses
    .map((h) => ({
      id: h.id,
      name: displayHouseName(h.name),
      totalDrogons: h.balance ? bigIntToNumber(h.balance.drogonsBalance) : 0,
      activityPoints: h.balance?.activityPoints ?? 0,
      updatedAt: h.balance?.updatedAt ?? null,
    }))
    .sort((a, b) => b.activityPoints - a.activityPoints || b.totalDrogons - a.totalDrogons);
  return NextResponse.json(withBalance);
}
