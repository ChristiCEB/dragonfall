/**
 * Normalize group name to "House <name>" if it doesn't already start with "House ".
 */
export function normalizeHouseName(groupName: string): string {
  const trimmed = groupName.trim();
  if (!trimmed) return "House Unknown";
  if (trimmed.toLowerCase().startsWith("house ")) return trimmed;
  return `House ${trimmed}`;
}
