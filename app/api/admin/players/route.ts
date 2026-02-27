import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const q = request.nextUrl.searchParams.get("search") ?? request.nextUrl.searchParams.get("q") ?? "";
  const where = q.trim()
    ? {
        OR: [
          { robloxUsername: { contains: q.trim(), mode: "insensitive" as const } },
          { robloxUserId: { contains: q.trim() } },
        ],
      }
    : {};
  const users = await prisma.user.findMany({
    where,
    include: { balance: true },
  });
  const list = users
    .map((u) => ({
      id: u.id,
      robloxUserId: u.robloxUserId,
      username: u.robloxUsername,
      displayName: u.robloxUsername,
      avatarUrl: u.avatarUrl,
      role: u.role,
      drogons: u.balance ? bigIntToNumber(u.balance.drogonsBalance) : 0,
      houseName: null as string | null,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => b.drogons - a.drogons);
  return NextResponse.json(list);
}
