import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { getClientIp } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";
import { isAllowlistSuperadmin } from "@/lib/admin-auth";

const REGISTER_PER_MIN_IP = 6;
const REGISTER_PER_MIN = 3;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await rateLimit(`register-ip:${ip}`, REGISTER_PER_MIN_IP))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Username required (at least 2 characters)." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]+$/.test(username)) {
    return NextResponse.json({ error: "Username: letters, numbers, underscore, hyphen only." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      passwordHash,
    },
  });

  const isAdminFlag = user.robloxUserId ? await isAdmin(user.robloxUserId, user.role as "USER" | "ADMIN") : false;
  const isSuperAdmin = user.robloxUserId ? isAllowlistSuperadmin(user.robloxUserId) : false;
  const token = await createSession({
    id: user.id,
    robloxUserId: user.robloxUserId ?? null,
    username: user.username,
    displayName: user.robloxUsername ?? user.username,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: isAdminFlag,
    isSuperAdmin,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, redirect: "/profile" });
}
