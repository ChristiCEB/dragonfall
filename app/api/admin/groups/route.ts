import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logEvent } from "@/lib/event-log";

const createSchema = z.object({
  groupName: z.string().min(1).max(200),
  groupId: z.number().int().min(0),
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
  minRank: z.number().int().min(0).max(254).optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim() ?? "";

  const groups = await prisma.group.findMany({
    orderBy: { groupName: "asc" },
  });

  let filtered = groups;
  if (search) {
    const q = search.toLowerCase();
    filtered = groups.filter(
      (g) =>
        g.groupName.toLowerCase().includes(q) ||
        String(g.groupId).includes(q)
    );
  }

  return NextResponse.json(filtered);
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

  const existing = await prisma.group.findUnique({
    where: { groupName: parsed.data.groupName },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Group name already exists" },
      { status: 409 }
    );
  }

  const group = await prisma.group.create({
    data: {
      groupName: parsed.data.groupName,
      groupId: parsed.data.groupId,
      r: parsed.data.r,
      g: parsed.data.g,
      b: parsed.data.b,
      minRank: parsed.data.minRank ?? null,
    },
  });

  await logEvent("admin_group_create", `Created group: ${group.groupName} (${group.groupId})`, { groupId: group.id, groupName: group.groupName }, guard.session.id);

  return NextResponse.json(group);
}
