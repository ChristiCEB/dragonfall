/**
 * Server-only: fetch Roblox user profile (bio, username, avatar) via public APIs.
 * No OAuth; used for bio verification. Results cached 30–60s to avoid rate limits.
 */

const CACHE_MS = 45 * 1000; // 45 seconds
const cache = new Map<string, { data: RobloxProfile; expiresAt: number }>();

export type RobloxProfile = {
  robloxUserId: string;
  username: string;
  description: string;
  avatarUrl: string | null;
};

/**
 * Parse Roblox profile URL or userId string to numeric id.
 * Accepts: "12345", "https://www.roblox.com/users/12345/profile", "/users/12345/profile"
 */
export function parseRobloxUserId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const numericOnly = /^\d+$/.exec(trimmed);
  if (numericOnly) return numericOnly[0];
  const profileMatch = /(?:roblox\.com\/users\/|/users/)(\d+)/i.exec(trimmed);
  return profileMatch ? profileMatch[1] : null;
}

/**
 * Fetch user info from users.roblox.com (description, name).
 * Then fetch avatar headshot from thumbnails.roblox.com.
 */
export async function getRobloxProfile(robloxUserId: string): Promise<RobloxProfile | null> {
  const key = `profile:${robloxUserId}`;
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, {
      headers: { "User-Agent": "Dragonfall/1.0 (Roblox profile verification)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Roblox users API ${res.status}`);
    }
    const userData = (await res.json()) as { id: number; name: string; description?: string };
    const username = userData.name ?? "";
    const description = (userData.description ?? "").trim();

    let avatarUrl: string | null = null;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png`,
        { headers: { "User-Agent": "Dragonfall/1.0" }, next: { revalidate: 0 } }
      );
      if (thumbRes.ok) {
        const thumbData = (await thumbRes.json()) as { data?: { imageUrl?: string }[] };
        const first = thumbData.data?.[0];
        if (first?.imageUrl) avatarUrl = first.imageUrl;
      }
    } catch {
      // non-fatal
    }

    const data: RobloxProfile = {
      robloxUserId: String(userData.id ?? robloxUserId),
      username,
      description,
      avatarUrl,
    };
    cache.set(key, { data, expiresAt: Date.now() + CACHE_MS });
    return data;
  } catch {
    return null;
  }
}
