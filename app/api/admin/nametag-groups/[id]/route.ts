import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { id } = await params;
  try {
    await prisma.nametagGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/nametag-groups DELETE]", err);
    return NextResponse.json({ error: "Not found or already deleted" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const updates: { groupName?: string; groupColor?: string; minRank?: number | null; sortOrder?: number } = {};
  if (typeof body.groupName === "string" && body.groupName.length > 0) updates.groupName = body.groupName;
  if (typeof body.groupColor === "string" && body.groupColor.length > 0) updates.groupColor = body.groupColor;
  if (body.minRank !== undefined) updates.minRank = body.minRank == null ? null : Number(body.minRank);
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  try {
    const group = await prisma.nametagGroup.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(group);
  } catch (err) {
    console.error("[admin/nametag-groups PATCH]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
