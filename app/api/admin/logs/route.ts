import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
  const logs = await prisma.eventLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { robloxUsername: true, robloxUserId: true } } },
  });
  return NextResponse.json(
    logs.map((l) => ({
      ...l,
      user: l.user ? { username: l.user.robloxUsername, robloxUserId: l.user.robloxUserId } : null,
    }))
  );
}
