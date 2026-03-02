import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";
import { parseRobloxUserId } from "@/lib/roblox-profile";
import { RobloxLinkStatus } from "@prisma/client";
import { customAlphabet } from "nanoid";

const LINK_REQUEST_PER_MIN_IP = 10;
const LINK_REQUEST_PER_MIN_USER = 5;
const EXPIRY_MINUTES = 30;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O, 1/I
const CODE_LENGTH = 6;

function generateCode(): string {
  const nanoid = customAlphabet(CODE_ALPHABET, CODE_LENGTH);
  return `DRAGONFALL-${nanoid()}`;
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const ip = getClientIp(request);
  if (!(await rateLimit(`link-roblox-ip:${ip}`, LINK_REQUEST_PER_MIN_IP))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  if (!(await rateLimit(`link-roblox-user:${auth.user.id}`, LINK_REQUEST_PER_MIN_USER))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const robloxProfileUrlOrUserId =
    typeof body.robloxProfileUrlOrUserId === "string" ? body.robloxProfileUrlOrUserId.trim() : null;
  if (!robloxProfileUrlOrUserId) {
    return NextResponse.json({ error: "Provide Roblox profile URL or user ID." }, { status: 400 });
  }

  const robloxUserId = parseRobloxUserId(robloxProfileUrlOrUserId);
  if (!robloxUserId) {
    return NextResponse.json({ error: "Invalid Roblox profile URL or user ID." }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);
  const code = generateCode();

  await prisma.robloxLinkRequest.updateMany({
    where: { userId: auth.user.id, status: RobloxLinkStatus.PENDING },
    data: { status: RobloxLinkStatus.EXPIRED },
  });

  await prisma.robloxLinkRequest.create({
    data: {
      userId: auth.user.id,
      robloxUserId,
      code,
      status: RobloxLinkStatus.PENDING,
      expiresAt,
    },
  });

  return NextResponse.json({ code, robloxUserId, expiresAt: expiresAt.toISOString() });
}
