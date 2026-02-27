/**
 * SERVER-ONLY: Suspicion scoring for postback payloads. Used to detect and reject
 * negative amounts, extremely high amounts, invalid types; log and webhook on reject.
 */

import { NextResponse } from "next/server";
import { logEvent } from "@/lib/event-log";
import { optionalDiscordWebhook } from "@/lib/discord";

export const MAX_REASONABLE_AMOUNT = 1_000_000;
const HIGH_AMOUNT_THRESHOLD = 100_000;

function peekNumber(obj: unknown, key: string): number | undefined {
  if (obj === null || typeof obj !== "object") return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "number" ? v : undefined;
}

export type SuspicionReasons =
  | "negative_amount"
  | "invalid_type"
  | "parse_failed"
  | "amount_extremely_high"
  | "amount_very_high";

/**
 * Compute a 0–100 suspicion score and list of reasons from raw body and optional parsed amount.
 */
export function computeSuspicionScore(
  slug: string,
  body: unknown,
  options: {
    parseFailed?: boolean;
    amount?: number;
    hasNegativeAmount?: boolean;
  } = {}
): { score: number; reasons: SuspicionReasons[] } {
  const reasons: SuspicionReasons[] = [];
  let score = 0;

  if (options.parseFailed) {
    reasons.push("parse_failed");
    score += 30;
  }
  if (options.hasNegativeAmount) {
    reasons.push("negative_amount");
    score += 50;
  }
  if (typeof options.amount === "number") {
    if (options.amount < 0) {
      reasons.push("negative_amount");
      score += 50;
    } else if (options.amount > MAX_REASONABLE_AMOUNT) {
      reasons.push("amount_extremely_high");
      score += 40;
    } else if (options.amount > HIGH_AMOUNT_THRESHOLD) {
      reasons.push("amount_very_high");
      score += 20;
    }
  }
  // Invalid types: body shape wrong (e.g. amount as string, missing required keys)
  if (options.parseFailed && typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    if ("amount" in obj && typeof obj.amount !== "number") {
      reasons.push("invalid_type");
      score += 25;
    }
  }

  const capped = Math.min(100, score);
  return { score: capped, reasons: [...new Set(reasons)] };
}

/** Sanitize body for logging: limit size and strip non-serializable values. */
function sanitizeForLog(body: unknown): Record<string, unknown> {
  if (body === null || body === undefined) return {};
  if (typeof body !== "object") return { value: String(body) };
  try {
    const obj = body as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") out[k] = v;
      else if (v === null) out[k] = null;
      else if (Array.isArray(v)) out[k] = v.slice(0, 5);
      else if (typeof v === "object") out[k] = "[object]";
    }
    return out;
  } catch {
    return { raw: "[unserializable]" };
  }
}

/**
 * Log suspicion to EventLog, send webhook, and return a 400 Response.
 * Call this when a payload is rejected due to suspicion.
 */
export async function rejectSuspiciousPayload(
  slug: string,
  body: unknown,
  score: number,
  reasons: SuspicionReasons[]
): Promise<NextResponse> {
  const payload = {
    slug,
    suspicionScore: score,
    reasons,
    body: sanitizeForLog(body),
  };
  await logEvent("suspicious_payload", `Suspicious postback rejected: ${reasons.join(", ")}`, payload).catch(
    () => {}
  );
  await optionalDiscordWebhook({
    type: "suspicious",
    message: `Suspicious postback rejected (score ${score})`,
    details: { slug, suspicionScore: score, reasons },
  });
  return NextResponse.json(
    { error: "Invalid request", code: "suspicious_payload" },
    { status: 400 }
  );
}

/** Slug-specific keys that hold a numeric amount/count to check. */
const AMOUNT_KEYS_BY_SLUG: Record<string, string> = {
  "spend-drogons": "amount",
  "loot-chests": "amount",
  "fort-loot-chests": "amount",
  "farm-chest": "amount",
  "activity-points": "activityPoints",
  "player-count": "playerCount",
};

/**
 * Compute suspicion when parse has failed. Peeks raw body for numeric fields (amount, activityPoints, playerCount).
 */
export function computeSuspicionOnParseFailure(slug: string, body: unknown): { score: number; reasons: SuspicionReasons[] } {
  let amount: number | undefined;
  for (const [prefix, key] of Object.entries(AMOUNT_KEYS_BY_SLUG)) {
    if (slug.startsWith(prefix)) {
      amount = peekNumber(body, key);
      break;
    }
  }
  return computeSuspicionScore(slug, body, {
    parseFailed: true,
    amount,
    hasNegativeAmount: amount !== undefined && amount < 0,
  });
}

/**
 * Check parsed numeric value; if suspicious (negative or > MAX_REASONABLE_AMOUNT), return score and reasons.
 */
export function checkParsedAmount(slug: string, amount: number): { score: number; reasons: SuspicionReasons[] } | null {
  if (amount < 0 || amount > MAX_REASONABLE_AMOUNT) {
    return computeSuspicionScore(slug, {}, { amount });
  }
  return null;
}
