const HOUSE_PREFIX = /^house\s+/i;

/**
 * Normalize group name for storage/display: strip "House " prefix (case-insensitive) and trim.
 * Stored/displayed name is the bare name (e.g. "Dragonfall"), with no forced prefix.
 */
export function normalizeHouseName(groupName: string): string {
  const trimmed = groupName.trim();
  if (!trimmed) return "Unknown";
  const withoutPrefix = trimmed.replace(HOUSE_PREFIX, "").trim();
  return withoutPrefix || "Unknown";
}

/**
 * Display name fallback: if name still has "House " prefix (e.g. legacy data), strip it for display.
 */
export function displayHouseName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Unknown";
  const withoutPrefix = trimmed.replace(HOUSE_PREFIX, "").trim();
  return withoutPrefix || "Unknown";
}
