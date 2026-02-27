import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/health — Liveness/readiness for load balancers and monitoring.
 * Returns 200 with status; pings DB if DATABASE_URL is set.
 */
export async function GET() {
  const payload: { status: string; database?: string } = { status: "ok" };
  try {
    if (process.env.DATABASE_URL) {
      await prisma.$queryRaw`SELECT 1`;
      payload.database = "connected";
    }
  } catch {
    payload.database = "error";
    return NextResponse.json(payload, { status: 503 });
  }
  return NextResponse.json(payload);
}
