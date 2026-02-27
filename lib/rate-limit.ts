import type { NextRequest } from "next/server";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // per window per IP for API
const POSTBACK_MAX_PER_MIN = 60;

/** Server-only: get client IP from request (for rate limiting). */
export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate limit for /postbacks/* routes: 60 requests/min per IP by default.
 * Returns true if allowed, false if rate limited. Use only server-side.
 */
export async function rateLimitByIp(
  request: NextRequest,
  maxPerMin = POSTBACK_MAX_PER_MIN
): Promise<boolean> {
  const ip = getClientIp(request);
  return rateLimit(`postback-ip:${ip}`, maxPerMin, WINDOW_MS);
}

// In-memory fallback when Upstash is not configured
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitMemory(identifier: string, max: number, _windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(identifier);
  if (!entry) {
    memoryStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of memoryStore.entries()) {
      if (now > v.resetAt) memoryStore.delete(key);
    }
  }, 60000);
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let upstashRatelimit: Ratelimit | null = null;

function getUpstashRatelimit(): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    upstashRatelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(200, "1 m"),
      analytics: false,
    });
    return upstashRatelimit;
  } catch {
    return null;
  }
}

/**
 * Returns true if the request is allowed, false if rate limited.
 * When Upstash env vars are set, uses @upstash/ratelimit; otherwise in-memory.
 */
export async function rateLimit(
  identifier: string,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<boolean> {
  const rl = getUpstashRatelimit();
  if (rl) {
    const { success } = await rl.limit(identifier);
    return success;
  }
  return rateLimitMemory(identifier, max, windowMs);
}
