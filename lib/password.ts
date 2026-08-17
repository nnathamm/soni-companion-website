import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function validatePassword(password: string) {
  return password.length >= 12 && password.length <= 128;
}

export async function hashPassword(password: string) {
  if (!validatePassword(password)) throw new Error("invalid_password");
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt-v1.${salt.toString("base64url")}.${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [version, saltValue, hashValue] = encoded.split(".");
  if (version !== "scrypt-v1" || !saltValue || !hashValue) return false;
  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(hashValue, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
