import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const [totalUsers, balanceAgg, activeBounties, latestSnapshot] = await Promise.all([
    prisma.user.count(),
    prisma.playerBalance.aggregate({ _sum: { drogonsBalance: true } }),
    prisma.bounty.count({ where: { status: "ACTIVE" } }),
    prisma.playerCountSnapshot.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const totalDrogons = balanceAgg._sum.drogonsBalance ?? BigInt(0);

  return NextResponse.json({
    totalUsers,
    totalDrogonsInEconomy: bigIntToNumber(totalDrogons),
    activeBounties,
    latestPlayerCount: latestSnapshot?.playerCount ?? 0,
    playerCountRecordedAt: latestSnapshot?.createdAt ?? null,
  });
}
