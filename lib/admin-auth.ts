/**
 * Admin authorization: allowlist (ADMIN_ROBLOX_USER_IDS) OR group membership with min rank.
 * Group rank is cached for 5 minutes; on lookup failure we fall back to allowlist only.
 * @see https://create.roblox.com/docs/cloud/legacy/groups/v1
 * @see https://create.roblox.com/docs/cloud/reference/GroupRole (rank 1-254)
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = { isAdmin: boolean; cachedAt: number };

const groupAdminCache = new Map<string, CacheEntry>();

function getAllowlist(): string[] {
  const raw =
    process.env.ADMIN_ROBLOX_USER_IDS ?? process.env.ROBLOX_ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True if robloxUserId is in ADMIN_ROBLOX_USER_IDS (superadmin). Only they can toggle user role. */
export function isAllowlistSuperadmin(robloxUserId: string): boolean {
  return getAllowlist().includes(robloxUserId);
}

function getCachedGroupAdmin(robloxUserId: string): boolean | null {
  const entry = groupAdminCache.get(robloxUserId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    groupAdminCache.delete(robloxUserId);
    return null;
  }
  return entry.isAdmin;
}

function setCachedGroupAdmin(robloxUserId: string, isAdmin: boolean): void {
  groupAdminCache.set(robloxUserId, { isAdmin, cachedAt: Date.now() });
}

/**
 * Fetches user's rank in the configured admin group.
 * GET https://groups.roblox.com/v1/users/{userId}/groups/roles
 * Returns rank (1-254) if in group, null otherwise or on error.
 */
async function fetchGroupRank(robloxUserId: string): Promise<number | null> {
  const groupId = process.env.ROBLOX_ADMIN_GROUP_ID;
  if (!groupId) return null;
  try {
    const res = await fetch(
      `https://groups.roblox.com/v1/users/${robloxUserId}/groups/roles`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Array<{ group?: { id: number }; role?: { rank: number } }>;
    };
    const item = data.data?.find(
      (r) => String(r.group?.id) === String(groupId)
    );
    const rank = item?.role?.rank;
    return typeof rank === "number" ? rank : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if user is admin by group (member of ROBLOX_ADMIN_GROUP_ID with rank >= ROBLOX_ADMIN_MIN_RANK).
 * Caches result for 5 minutes. On fetch failure, returns false (caller falls back to allowlist).
 */
export async function isAdminByGroup(robloxUserId: string): Promise<boolean> {
  const cached = getCachedGroupAdmin(robloxUserId);
  if (cached !== null) return cached;

  const minRank = Number(process.env.ROBLOX_ADMIN_MIN_RANK);
  const rank = await fetchGroupRank(robloxUserId);
  if (rank === null) {
    setCachedGroupAdmin(robloxUserId, false);
    return false;
  }
  const meetsRank = !Number.isNaN(minRank) && rank >= minRank;
  setCachedGroupAdmin(robloxUserId, meetsRank);
  return meetsRank;
}

/**
 * Server-side admin check: allowlist OR group (with min rank, cached 5 min) OR user.role === ADMIN.
 * If group lookup fails we do not cache a negative result for the whole TTL; we re-fetch next time.
 * So "fall back to allowlist only" means: when group API fails, only allowlist users are admin until next request.
 */
export async function isAdmin(
  robloxUserId: string,
  userRole?: "USER" | "ADMIN"
): Promise<boolean> {
  if (userRole === "ADMIN") return true;
  if (isAllowlistSuperadmin(robloxUserId)) return true;
  return isAdminByGroup(robloxUserId);
}
