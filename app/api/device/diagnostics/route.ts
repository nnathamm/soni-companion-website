import { NextRequest } from "next/server";
import { authenticateDevice } from "@/lib/device-auth";
import { deviceError } from "@/lib/device-response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOLEAN_CHECKS = ["audioCapture", "audioPlayback", "displayConnected", "privacySleep"] as const;
const NUMBER_CHECKS = ["storageFreeGb", "temperatureC"] as const;

export async function POST(request: NextRequest) {
  try {
    const device = await authenticateDevice(request);
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as Record<string, unknown>;
    const input = body.checks;
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid_input");
    const raw = input as Record<string, unknown>;
    const checks: Record<string, boolean | number> = {};
    for (const key of BOOLEAN_CHECKS) {
      if (typeof raw[key] !== "boolean") throw new Error("invalid_input");
      checks[key] = raw[key];
    }
    for (const key of NUMBER_CHECKS) {
      const value = Number(raw[key]);
      if (!Number.isFinite(value)) throw new Error("invalid_input");
      checks[key] = key === "storageFreeGb" ? Math.max(0, Math.min(1000, value)) : Math.max(-20, Math.min(120, value));
    }
    const uptime = Math.max(0, Math.min(10 * 365 * 86400, Math.trunc(Number(body.uptimeSeconds) || 0)));
    const ready = Boolean(
      checks.audioCapture && checks.audioPlayback && checks.displayConnected
      && Number(checks.storageFreeGb) >= 1 && Number(checks.temperatureC) < 85,
    );
    await db()`
      INSERT INTO device_diagnostics (device_id, status, checks, uptime_seconds)
      VALUES (${device.id}, ${ready ? "ready" : "attention"}, ${JSON.stringify(checks)}::jsonb, ${uptime})
      ON CONFLICT (device_id) DO UPDATE SET status=EXCLUDED.status, checks=EXCLUDED.checks,
        uptime_seconds=EXCLUDED.uptime_seconds, reported_at=now()
    `;
    return Response.json({ ok: true, status: ready ? "ready" : "attention" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
