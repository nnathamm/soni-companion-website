import { createHmac, randomInt } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { cleanText, tokenHash } from "./security";

const TOKEN_PATTERN = /^([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/;
const PAIRING_WINDOW_MINUTES = 10;
const PAIRING_MAX_ATTEMPTS = 8;

export type DeviceIdentity = {
  id: string;
  profileId: string;
  deviceId: string;
  deviceName: string;
  softwareVersion: string;
};

export function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export function validateDeviceToken(token: string, expectedDeviceId?: string) {
  const match = TOKEN_PATTERN.exec(token);
  if (!match || (expectedDeviceId && match[1] !== expectedDeviceId)) throw new Error("device_unauthorized");
  return { deviceId: match[1], hash: tokenHash(token) };
}

export async function authenticateDevice(request: NextRequest): Promise<DeviceIdentity> {
  const token = validateDeviceToken(bearerToken(request));
  const rows = await db()<{
    id: string;
    profile_id: string;
    device_id: string;
    device_name: string;
    software_version: string;
  }[]>`
    SELECT id, profile_id, device_id, device_name, software_version
    FROM household_devices
    WHERE device_id = ${token.deviceId}
      AND token_hash = ${token.hash}
      AND status = 'active'
    LIMIT 1
  `;
  const device = rows[0];
  if (!device) throw new Error("device_unauthorized");
  return {
    id: device.id,
    profileId: device.profile_id,
    deviceId: device.device_id,
    deviceName: device.device_name,
    softwareVersion: device.software_version,
  };
}

function pairingRateKey(request: NextRequest) {
  const secret = process.env.SONI_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("portal_not_configured");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret).update(`device-pair:${address}`).digest("hex");
}

export async function consumePairingAttempt(request: NextRequest) {
  const key = pairingRateKey(request);
  const rows = await db()<{ allowed: boolean }[]>`
    INSERT INTO device_pairing_limits (key_hash, attempts, window_started_at, blocked_until)
    VALUES (${key}, 1, now(), NULL)
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN device_pairing_limits.window_started_at < now() - (${PAIRING_WINDOW_MINUTES} * interval '1 minute') THEN 1
        ELSE device_pairing_limits.attempts + 1
      END,
      window_started_at = CASE
        WHEN device_pairing_limits.window_started_at < now() - (${PAIRING_WINDOW_MINUTES} * interval '1 minute') THEN now()
        ELSE device_pairing_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN device_pairing_limits.window_started_at < now() - (${PAIRING_WINDOW_MINUTES} * interval '1 minute') THEN NULL
        WHEN device_pairing_limits.attempts + 1 >= ${PAIRING_MAX_ATTEMPTS} THEN now() + (${PAIRING_WINDOW_MINUTES} * interval '1 minute')
        ELSE device_pairing_limits.blocked_until
      END
    RETURNING blocked_until IS NULL OR blocked_until <= now() AS allowed
  `;
  if (!rows[0]?.allowed) throw new Error("pairing_rate_limited");
}

export function deviceInput(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("invalid_input");
  const body = value as Record<string, unknown>;
  const deviceId = String(body.deviceId ?? "");
  if (!/^[a-f0-9]{32}$/.test(deviceId)) throw new Error("invalid_input");
  return {
    deviceId,
    deviceName: cleanText(String(body.deviceName ?? "Soni"), 80) || "Soni",
    softwareVersion: cleanText(String(body.softwareVersion ?? ""), 40),
  };
}

export function pairingCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
