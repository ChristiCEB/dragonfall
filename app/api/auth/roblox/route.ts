import { NextResponse } from "next/server";

/**
 * Legacy entry: redirect to canonical GET /login (Roblox OAuth with PKCE/confidential).
 */
export async function GET() {
  return NextResponse.redirect(new URL("/login", process.env.APP_BASE_URL || "http://localhost:3000"));
}
