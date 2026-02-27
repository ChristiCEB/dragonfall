/** Convert BigInt to number for JSON responses (clamps to safe integer range). */
export function bigIntToNumber(value: bigint): number {
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : Number.MAX_SAFE_INTEGER;
}
