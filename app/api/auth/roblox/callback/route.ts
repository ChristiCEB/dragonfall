import { NextResponse } from "next/server";

/**
 * Legacy callback URL. Canonical callback is GET /auth/callback.
 * Redirect to login so user can sign in with the new flow.
 */
export async function GET() {
  const base = process.env.APP_BASE_URL || process.env.BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/login", base));
}
