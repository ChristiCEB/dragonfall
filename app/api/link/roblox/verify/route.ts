import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";
import { getRobloxProfile } from "@/lib/roblox-profile";
import { RobloxLinkStatus } from "@prisma/client";
import { createSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";

const LINK_VERIFY_PER_MIN_IP = 15;
const LINK_VERIFY_PER_MIN_USER = 10;

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const ip = getClientIp(request);
  if (!(await rateLimit(`link-roblox-verify-ip:${ip}`, LINK_VERIFY_PER_MIN_IP))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  if (!(await rateLimit(`link-roblox-verify-user:${auth.user.id}`, LINK_VERIFY_PER_MIN_USER))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const pending = await prisma.robloxLinkRequest.findFirst({
    where: { userId: auth.user.id, status: RobloxLinkStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    return NextResponse.json({ error: "No pending link request. Create one first and put the code in your Roblox bio." }, { status: 400 });
  }
  if (new Date() > pending.expiresAt) {
    await prisma.robloxLinkRequest.update({
      where: { id: pending.id },
      data: { status: RobloxLinkStatus.EXPIRED },
    });
    return NextResponse.json({ error: "Link request expired. Regenerate a new code." }, { status: 400 });
  }

  const profile = await getRobloxProfile(pending.robloxUserId);
  if (!profile) {
    return NextResponse.json({ error: "Could not load Roblox profile. Check the user ID and try again." }, { status: 400 });
  }

  const codeInBio = profile.description.includes(pending.code);
  if (!codeInBio) {
    return NextResponse.json({
      error: "Code not found in your Roblox bio. Copy the code into your Roblox profile About section, save, then click Verify again.",
    }, { status: 400 });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.robloxLinkRequest.update({
      where: { id: pending.id },
      data: { status: RobloxLinkStatus.VERIFIED },
    }),
    prisma.user.update({
      where: { id: auth.user.id },
      data: {
        robloxUserId: profile.robloxUserId,
        robloxUsername: profile.username,
        avatarUrl: profile.avatarUrl,
        robloxVerifiedAt: now,
      },
    }),
    prisma.playerBalance.upsert({
      where: { robloxUserId: profile.robloxUserId },
      create: { robloxUserId: profile.robloxUserId, drogonsBalance: BigInt(0), updatedAt: now },
      update: { updatedAt: now },
    }),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, robloxUserId: true, robloxUsername: true, avatarUrl: true, role: true },
  });
  if (updatedUser) {
    const isAdminFlag = await isAdmin(updatedUser.robloxUserId ?? "", updatedUser.role as "USER" | "ADMIN");
    const token = await createSession({
      id: updatedUser.id,
      robloxUserId: updatedUser.robloxUserId ?? "",
      username: updatedUser.robloxUsername ?? "",
      displayName: updatedUser.robloxUsername,
      avatarUrl: updatedUser.avatarUrl ?? null,
      isAdmin: isAdminFlag,
    });
    await setSessionCookie(token);
  }

  return NextResponse.json({
    success: true,
    robloxUsername: profile.username,
    robloxUserId: profile.robloxUserId,
  });
}
