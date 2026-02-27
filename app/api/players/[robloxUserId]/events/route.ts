import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ robloxUserId: string }> }
) {
  if (!(await rateLimit(`api:${getClientIp(request)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { robloxUserId } = await params;
  const user = await prisma.user.findUnique({ where: { robloxUserId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const logs = await prisma.eventLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      type: l.type,
      message: l.message,
      payload: l.payload,
      createdAt: l.createdAt,
    }))
  );
}
