import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  groupName: z.string().min(1),
  groupId: z.number().int().min(0),
  groupColor: z.string().min(1), // e.g. "170,32,32"
  minRank: z.number().int().min(0).max(255).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const groups = await prisma.nametagGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const group = await prisma.nametagGroup.upsert({
    where: { groupId: data.groupId },
    create: {
      groupName: data.groupName,
      groupId: data.groupId,
      groupColor: data.groupColor,
      minRank: data.minRank ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    update: {
      groupName: data.groupName,
      groupColor: data.groupColor,
      minRank: data.minRank ?? null,
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
  return NextResponse.json(group);
}
