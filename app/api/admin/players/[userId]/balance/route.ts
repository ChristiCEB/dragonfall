import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/event-log";
import { z } from "zod";
import { bigIntToNumber } from "@/lib/bigint";

const bodySchema = z.object({ drogons: z.number().int().min(0) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const session = guard.session;
  const { userId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { balance: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const previousDrogons = user.balance ? bigIntToNumber(user.balance.drogonsBalance) : 0;
  await prisma.playerBalance.upsert({
    where: { robloxUserId: user.robloxUserId },
    create: { robloxUserId: user.robloxUserId, drogonsBalance: BigInt(parsed.data.drogons) },
    update: { drogonsBalance: BigInt(parsed.data.drogons) },
  });
  await logEvent(
    "admin_set_balance",
    `Balance set to ${parsed.data.drogons}`,
    { previousDrogons, newDrogons: parsed.data.drogons, adminId: session.id },
    user.id
  );
  return NextResponse.json({ ok: true, drogons: parsed.data.drogons });
}
