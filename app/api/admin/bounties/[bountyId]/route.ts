import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { BountyStatus } from "@prisma/client";

const bodySchema = z.object({
  status: z.enum(["ACTIVE", "CLAIMED", "CANCELLED"]).optional(),
  amount: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { bountyId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  const data: { status?: BountyStatus; amount?: number } = {};
  if (parsed.data.status !== undefined) data.status = parsed.data.status as BountyStatus;
  if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
  await prisma.bounty.update({
    where: { id: bountyId },
    data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { bountyId } = await params;
  await prisma.bounty.update({
    where: { id: bountyId },
    data: { status: BountyStatus.CANCELLED },
  });
  return NextResponse.json({ ok: true });
}
