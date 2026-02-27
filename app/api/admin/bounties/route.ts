import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  targetRobloxUserId: z.string().min(1),
  amount: z.number().int().min(0),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const bounties = await prisma.bounty.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bounties);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const bounty = await prisma.bounty.create({
    data: {
      targetRobloxUserId: parsed.data.targetRobloxUserId,
      amount: parsed.data.amount,
    },
  });
  return NextResponse.json(bounty);
}
