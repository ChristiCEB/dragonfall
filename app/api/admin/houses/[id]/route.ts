import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { bigIntToNumber } from "@/lib/bigint";
import { displayHouseName, normalizeHouseName } from "@/lib/house-name";
import { logEvent } from "@/lib/event-log";
import { optionalDiscordWebhook } from "@/lib/discord";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  groupId: z.number().int().min(0).nullable().optional(),
  r: z.number().int().min(0).max(255).optional(),
  g: z.number().int().min(0).max(255).optional(),
  b: z.number().int().min(0).max(255).optional(),
  isActive: z.boolean().optional(),
  totalDrogons: z.number().int().min(0).optional(),
  activityPoints: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.house.findUnique({ where: { id }, include: { balance: true } });
  if (!existing) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  if (parsed.data.name !== undefined && parsed.data.name.trim()) {
    const name = normalizeHouseName(parsed.data.name.trim());
    const duplicate = await prisma.house.findFirst({ where: { name, id: { not: id } } });
    if (duplicate) {
      return NextResponse.json({ error: "House name already exists" }, { status: 409 });
    }
    await prisma.house.update({
      where: { id },
      data: { name },
    });
  }

  const houseData: Parameters<typeof prisma.house.update>[0]["data"] = {};
  if (parsed.data.groupId !== undefined) houseData.groupId = parsed.data.groupId;
  if (parsed.data.r !== undefined) houseData.r = parsed.data.r;
  if (parsed.data.g !== undefined) houseData.g = parsed.data.g;
  if (parsed.data.b !== undefined) houseData.b = parsed.data.b;
  if (parsed.data.isActive !== undefined) houseData.isActive = parsed.data.isActive;

  if (Object.keys(houseData).length > 0) {
    await prisma.house.update({ where: { id }, data: houseData });
  }

  if (parsed.data.totalDrogons !== undefined || parsed.data.activityPoints !== undefined) {
    await prisma.houseBalance.upsert({
      where: { houseId: id },
      create: {
        houseId: id,
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
    where: { id },
    include: { balance: true },
  });

  await logEvent("admin_house_update", `Updated house: ${displayHouseName(updated!.name)} (id ${id})`, { houseId: id }, guard.session.id);

  return NextResponse.json({
    id: updated!.id,
    name: displayHouseName(updated!.name),
    rawName: updated!.name,
    groupId: updated!.groupId,
    r: updated!.r,
    g: updated!.g,
    b: updated!.b,
    isActive: updated!.isActive,
    totalDrogons: updated!.balance ? bigIntToNumber(updated!.balance.drogonsBalance) : 0,
    activityPoints: updated!.balance?.activityPoints ?? 0,
    updatedAt: updated!.updatedAt?.toISOString() ?? null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const existing = await prisma.house.findUnique({
    where: { id },
    include: { balance: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  await prisma.house.delete({ where: { id } });

  await logEvent("admin_house_delete", `Deleted house: ${displayHouseName(existing.name)}`, { houseId: id, name: existing.name }, guard.session.id);

  optionalDiscordWebhook({
    type: "admin_destructive",
    message: `Admin deleted house: ${displayHouseName(existing.name)}`,
    details: { action: "delete_house", houseId: id, name: existing.name },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
