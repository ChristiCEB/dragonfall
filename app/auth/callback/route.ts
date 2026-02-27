import { NextRequest, NextResponse } from "next/server";
import {
  getRedirectUri,
  getTokenEndpoint,
  getUserInfoEndpoint,
  getClientId,
  getClientSecret,
  useConfidentialClient,
} from "@/lib/roblox-oauth";
import { createSession, getOrCreateUser } from "@/lib/auth";
import { isAllowlistSuperadmin } from "@/lib/admin-auth";

const BASE_URL = process.env.APP_BASE_URL ?? process.env.BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * GET /auth/callback — OAuth 2.0 callback: exchange code for tokens, fetch userinfo, upsert User, set session.
 * Supports PKCE (public client) or confidential client (client_secret in body).
 * @see https://create.roblox.com/docs/cloud/auth/oauth2-reference (POST v1/token, GET v1/userinfo)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get("roblox_oauth_state")?.value;
  const codeVerifier = request.cookies.get("roblox_oauth_code_verifier")?.value;

  const errorUrl = `${BASE_URL.replace(/\/$/, "")}/error`;

  if (!code || !state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(`${errorUrl}?error=auth_failed`);
  }

  const redirectUri = getRedirectUri();
  const body = new URLSearchParams({
    client_id: getClientId(),
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  if (useConfidentialClient()) {
    const secret = getClientSecret();
    if (secret) body.set("client_secret", secret);
  }

  const tokenRes = await fetch(getTokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(`${errorUrl}?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(`${errorUrl}?error=no_token`);
  }

  const userInfoRes = await fetch(getUserInfoEndpoint(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userInfoRes.ok) {
    return NextResponse.redirect(`${errorUrl}?error=userinfo_failed`);
  }

  const userInfo = (await userInfoRes.json()) as {
    sub?: string;
    preferred_username?: string;
    name?: string;
    picture?: string | null;
  };
  const robloxUserId = userInfo.sub;
  const username = userInfo.preferred_username ?? userInfo.name ?? "Unknown";
  const displayName = userInfo.name ?? username;
  const picture = userInfo.picture ?? null;

  if (!robloxUserId) {
    return NextResponse.redirect(`${errorUrl}?error=no_user_id`);
  }

  const { user, isAdmin } = await getOrCreateUser(robloxUserId, username, picture, displayName);
  const token = await createSession({
    id: user.id,
    robloxUserId: user.robloxUserId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin,
    isSuperAdmin: isAllowlistSuperadmin(robloxUserId),
  });

  const res = NextResponse.redirect(`${BASE_URL.replace(/\/$/, "")}/profile`);
  res.cookies.set("dragonfall_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  res.cookies.delete("roblox_oauth_state");
  res.cookies.delete("roblox_oauth_code_verifier");
  return res;
}
