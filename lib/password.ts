/**
 * Server-only: password hashing and verification using Node crypto (scrypt).
 * No external deps; constant-time comparison to avoid timing attacks.
 */

import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const key = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `${salt}:${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hexKey] = stored.split(":");
  if (!salt || !hexKey) return false;
  const key = Buffer.from(hexKey, "hex");
  if (key.length !== KEY_LEN) return false;
  const computed = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return timingSafeEqual(key, computed);
}
