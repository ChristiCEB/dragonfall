import { z } from "zod";
import { NextResponse } from "next/server";

/** SERVER-ONLY: Parse postback body with zod; returns 400 Response on failure. */
export function parsePostbackPayload<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const parsed = schema.safeParse(body);
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    response: NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    ),
  };
}

export const activityPointsPostback = z.object({
  groupName: z.string().min(1),
  activityPoints: z.number().int().min(0),
});

export const spendDrogonsPostback = z.object({
  roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
  amount: z.number().int().min(0),
  reason: z.string().default(""),
});

export const lootChestsPostback = z.object({
  roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
  amount: z.number().int().min(0),
  position: z.string().optional(),
});

export const collectBountyPostback = z.object({
  target_roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
  claimed_roblox_username: z.string(),
  claimed_roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
});

export const playerCountPostback = z.object({
  playerCount: z.number().int().min(0),
});

export const fortLootChestsPostback = z.object({
  roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
  amount: z.number().int().min(0),
});

export const farmChestPostback = z.object({
  roblox_userid: z.union([z.string(), z.number()]).transform((v): string => String(v)),
  amount: z.number().int().min(0),
});
