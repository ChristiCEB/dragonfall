import { requireAdmin as requireAdminAuth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

/**
 * Requires admin. Re-exports auth.requireAdmin with legacy return shape { session } for compatibility.
 */
export async function requireAdmin(): Promise<{ error: Response } | { session: SessionUser }> {
  const result = await requireAdminAuth();
  if ("error" in result) return { error: result.error };
  return { session: result.user };
}
