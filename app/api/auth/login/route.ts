import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { getClientIp } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";
import { isAllowlistSuperadmin } from "@/lib/admin-auth";

const LOGIN_PER_MIN_IP = 15;
const LOGIN_PER_MIN = 10;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await rateLimit(`login-ip:${ip}`, LOGIN_PER_MIN_IP))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const login = typeof body.login === "string" ? body.login.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!login || !password) {
    return NextResponse.json({ error: "Username/email and password required." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: login },
        ...(login.includes("@") ? [{ email: login }] : []),
      ],
    },
  });

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid username/email or password." }, { status: 401 });
  }

  const isAdminFlag = user.robloxUserId ? await isAdmin(user.robloxUserId, user.role as "USER" | "ADMIN") : user.role === "ADMIN";
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
