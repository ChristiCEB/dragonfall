import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { isAllowlistSuperadmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const bodySchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

/** Only allowlist superadmins can toggle another user's role. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  if (!isAllowlistSuperadmin(guard.session.robloxUserId)) {
    return NextResponse.json({ error: "Forbidden: only allowlist superadmins can change user role" }, { status: 403 });
  }
  const { userId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role as UserRole },
  });
  return NextResponse.json({ ok: true, role: parsed.data.role });
}
