import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { bearerToken, consumePairingAttempt, deviceInput, pairingCode, validateDeviceToken } from "@/lib/device-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await consumePairingAttempt(request);
    const input = deviceInput(await request.json().catch(() => { throw new Error("invalid_json"); }));
    const token = validateDeviceToken(bearerToken(request), input.deviceId);
    const sql = db();
    await sql`DELETE FROM remote_display_pairing_requests WHERE expires_at <= now() OR display_id=${input.deviceId}`;
    let created: { id: string; pairing_code: string; expires_at: string } | undefined;
    for (let attempt = 0; attempt < 6 && !created; attempt += 1) {
      try {
        const rows = await sql<{ id: string; pairing_code: string; expires_at: string }[]>`
          INSERT INTO remote_display_pairing_requests (pairing_code, display_id, token_hash, display_name, expires_at)
          VALUES (${pairingCode()}, ${input.deviceId}, ${token.hash}, ${input.deviceName}, now() + interval '10 minutes')
          RETURNING id, pairing_code, expires_at::text
        `;
        created = rows[0];
      } catch (error) {
        if (!error || typeof error !== "object" || (error as { code?: string }).code !== "23505") throw error;
      }
    }
    if (!created) throw new Error("request_failed");
    return Response.json({ ok: true, requestId: created.id, pairingCode: created.pairing_code, expiresAt: created.expires_at }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
