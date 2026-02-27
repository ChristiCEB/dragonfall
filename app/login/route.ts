import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getAuthorizeUrl } from "@/lib/roblox-oauth";

/**
 * GET /login — Redirects to Roblox OAuth 2.0 authorize endpoint (Authorization Code + PKCE).
 * @see https://create.roblox.com/docs/cloud/auth/oauth2-reference (GET v1/authorize)
 */
export async function GET() {
  try {
    const state = randomBytes(24).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256")
      .update(verifier)
      .digest("base64url")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const redirectUrl = getAuthorizeUrl(state, challenge);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("roblox_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    res.cookies.set("roblox_oauth_code_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Login redirect error:", e);
    return NextResponse.redirect(new URL("/error?error=oauth_config", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }
}
