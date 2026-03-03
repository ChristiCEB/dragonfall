import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logEvent } from "@/lib/event-log";
import { optionalDiscordWebhook } from "@/lib/discord";

const updateSchema = z.object({
  groupName: z.string().min(1).max(200).optional(),
  groupId: z.number().int().min(0).optional(),
  r: z.number().int().min(0).max(255).optional(),
  g: z.number().int().min(0).max(255).optional(),
  b: z.number().int().min(0).max(255).optional(),
  minRank: z.number().int().min(0).max(254).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.group.findUnique({ where: { id: idNum } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (parsed.data.groupName !== undefined && parsed.data.groupName !== existing.groupName) {
    const duplicate = await prisma.group.findUnique({
      where: { groupName: parsed.data.groupName },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 409 }
      );
    }
  }

  const group = await prisma.group.update({
    where: { id: idNum },
    data: {
      ...(parsed.data.groupName !== undefined && { groupName: parsed.data.groupName }),
      ...(parsed.data.groupId !== undefined && { groupId: parsed.data.groupId }),
      ...(parsed.data.r !== undefined && { r: parsed.data.r }),
      ...(parsed.data.g !== undefined && { g: parsed.data.g }),
      ...(parsed.data.b !== undefined && { b: parsed.data.b }),
      ...(parsed.data.minRank !== undefined && { minRank: parsed.data.minRank }),
    },
  });

  await logEvent("admin_group_update", `Updated group: ${group.groupName} (id ${group.id})`, { groupId: group.id }, guard.session.id);

  return NextResponse.json(group);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.group.findUnique({ where: { id: idNum } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await prisma.group.delete({ where: { id: idNum } });

  await logEvent("admin_group_delete", `Deleted group: ${existing.groupName} (${existing.groupId})`, { groupId: existing.id, groupName: existing.groupName }, guard.session.id);

  optionalDiscordWebhook({
    type: "admin_destructive",
    message: `Admin deleted nametag group: ${existing.groupName} (Roblox group ID ${existing.groupId})`,
    details: { action: "delete_group", groupId: existing.id, groupName: existing.groupName },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
