import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dragonfall-secret-change-me");
const COOKIE_NAME = "dragonfall_session";
const JWT_ISSUER = "dragonfall";
const JWT_AUDIENCE = "dragonfall";
const MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

export type SessionUser = {
  id: string;
  robloxUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  /** True if in ADMIN_ROBLOX_USER_IDS (only they can toggle user role). */
  isSuperAdmin?: boolean;
};

type JWTClaims = {
  sub: string;
  robloxUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    sub: user.id,
    robloxUserId: user.robloxUserId,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
  } as Omit<JWTClaims, "iat" | "exp" | "iss" | "aud">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const claims = payload as unknown as JWTClaims;
    return {
      id: claims.sub,
      robloxUserId: claims.robloxUserId,
      username: claims.username,
      displayName: claims.displayName ?? null,
      avatarUrl: claims.avatarUrl ?? null,
      isAdmin: !!claims.isAdmin,
      isSuperAdmin: !!claims.isSuperAdmin,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current session user or null. Use in server components and route handlers.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

/**
 * Requires an authenticated user. Returns { user } or { error: Response } (401).
 * Use in route handlers: const result = await requireUser(); if ("error" in result) return result.error;
 */
export async function requireUser(): Promise<{ user: SessionUser } | { error: Response }> {
  const user = await getSession();
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user };
}

/**
 * Requires an authenticated admin. Returns { user } or { error: Response } (401 if not logged in, 403 if not admin).
 * Use in route handlers: const result = await requireAdmin(); if ("error" in result) return result.error;
 */
export async function requireAdmin(): Promise<{ user: SessionUser } | { error: Response }> {
  const user = await getSession();
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  if (!user.isAdmin) {
    return {
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

import { isAdmin } from "@/lib/admin-auth";
export { isAdmin } from "@/lib/admin-auth";

export async function getOrCreateUser(robloxUserId: string, username: string, avatarUrl: string | null, _displayName?: string): Promise<{ user: { id: string; robloxUserId: string; username: string; displayName: string | null; avatarUrl: string | null }; isAdmin: boolean }> {
  let user = await prisma.user.findUnique({ where: { robloxUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        robloxUserId,
        robloxUsername: username,
        avatarUrl,
      },
    });
    await prisma.playerBalance.create({
      data: { robloxUserId: user.robloxUserId, drogonsBalance: BigInt(0) },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { robloxUsername: username, avatarUrl },
    });
  }
  const isAdminFlag = await isAdmin(robloxUserId, user.role as "USER" | "ADMIN");
  return {
    user: {
      id: user.id,
      robloxUserId: user.robloxUserId,
      username: user.robloxUsername,
      displayName: user.robloxUsername,
      avatarUrl: user.avatarUrl,
    },
    isAdmin: isAdminFlag,
  };
}
