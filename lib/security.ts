import { createHash, createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase().slice(0, 254);
}

export function cleanText(value: string, maximum: number) {
  return value.replace(/[<>\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function tokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function attemptKey(email: string) {
  const secret = process.env.SONI_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("portal_not_configured");
  return createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
    throw new Error("invalid_origin");
  }
}

export function safeReturnTo(value: FormDataEntryValue | null, fallback = "/portal") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value.slice(0, 240);
}
