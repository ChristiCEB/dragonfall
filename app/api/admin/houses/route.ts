import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { bigIntToNumber } from "@/lib/bigint";

const bodySchema = z.object({
  name: z.string().min(1),
  totalDrogons: z.number().int().min(0).optional(),
  activityPoints: z.number().int().min(0).optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const houses = await prisma.house.findMany({
    include: { balance: true },
    orderBy: { name: "asc" },
  });
  const result = houses.map((h) => ({
    id: h.id,
    name: h.name,
    totalDrogons: h.balance ? bigIntToNumber(h.balance.drogonsBalance) : 0,
    activityPoints: h.balance?.activityPoints ?? 0,
    updatedAt: h.balance?.updatedAt ?? null,
  }));
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const house = await prisma.house.upsert({
    where: { name: parsed.data.name },
    create: { name: parsed.data.name },
    update: {},
  });
  if (parsed.data.totalDrogons !== undefined || parsed.data.activityPoints !== undefined) {
    await prisma.houseBalance.upsert({
      where: { houseId: house.id },
      create: {
        houseId: house.id,
        drogonsBalance: BigInt(parsed.data.totalDrogons ?? 0),
        activityPoints: parsed.data.activityPoints ?? 0,
      },
      update: {
        ...(parsed.data.totalDrogons !== undefined && { drogonsBalance: BigInt(parsed.data.totalDrogons) }),
        ...(parsed.data.activityPoints !== undefined && { activityPoints: parsed.data.activityPoints }),
      },
    });
  }
  const updated = await prisma.house.findUnique({
    where: { id: house.id },
    include: { balance: true },
  });
  return NextResponse.json({
    id: updated!.id,
    name: updated!.name,
    totalDrogons: updated!.balance ? bigIntToNumber(updated!.balance.drogonsBalance) : 0,
    activityPoints: updated!.balance?.activityPoints ?? 0,
  });
}
