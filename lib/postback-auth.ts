import { NextRequest } from "next/server";

/**
 * SERVER-ONLY: Do not import from client components. Uses ROBLOX_PRIVATE_KEY.
 * Roblox private key for postback auth. Never expose to client.
 * Prefer ROBLOX_PRIVATE_KEY; POSTBACK_KEY supported for backward compatibility.
 */
function getPrivateKey(): string | undefined {
  return process.env.ROBLOX_PRIVATE_KEY ?? process.env.POSTBACK_KEY;
}

/**
 * Validates that the request has ?key= matching ROBLOX_PRIVATE_KEY (or POSTBACK_KEY).
 * Use only in server-side route handlers. Never send the key to the client.
 */
export function validateRobloxPrivateKey(request: NextRequest): boolean {
  const secret = getPrivateKey();
  if (!secret || secret.length === 0) return false;
  const key = request.nextUrl.searchParams.get("key");
  return key === secret;
}

/**
 * If the request is missing or invalid key, returns a 401 Response; otherwise null.
 * Never includes the actual key in the response.
 */
export function requireRobloxPrivateKey(request: NextRequest): Response | null {
  if (!validateRobloxPrivateKey(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/** @deprecated Use requireRobloxPrivateKey */
export function requirePostbackKey(request: NextRequest): Response | null {
  return requireRobloxPrivateKey(request);
}

/** @deprecated Use validateRobloxPrivateKey */
export function validatePostbackKey(request: NextRequest): boolean {
  return validateRobloxPrivateKey(request);
}
