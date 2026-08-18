import { bearerToken, validateDeviceToken } from "@/lib/device-auth";
import { db } from "@/lib/db";
import { deviceError } from "@/lib/device-response";
import { isUuid } from "@/lib/security";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestId = new URL(request.url).searchParams.get("requestId") ?? "";
    if (!isUuid(requestId)) throw new Error("invalid_input");
    const token = validateDeviceToken(bearerToken(request));
    const rows = await db()<{
      approved_profile_id: string | null;
      profile_label: string | null;
      preferred_name: string | null;
      status: string | null;
      expires_at: string;
    }[]>`
      SELECT r.approved_profile_id, p.profile_label, p.preferred_name, p.status, r.expires_at::text
      FROM device_pairing_requests r
      LEFT JOIN senior_profiles p ON p.id = r.approved_profile_id
      WHERE r.id = ${requestId}
        AND r.device_id = ${token.deviceId}
        AND r.token_hash = ${token.hash}
        AND r.expires_at > now()
      LIMIT 1
    `;
    const pairing = rows[0];
    if (!pairing) throw new Error("pairing_expired");
    if (!pairing.approved_profile_id) {
      return Response.json({ ok: true, state: "pending", expiresAt: pairing.expires_at }, { headers: { "Cache-Control": "no-store" } });
    }
    await db()`UPDATE device_pairing_requests SET claimed_at = COALESCE(claimed_at, now()) WHERE id = ${requestId}`;
    return Response.json({
      ok: true,
      state: "approved",
      profile: {
        id: pairing.approved_profile_id,
        label: pairing.profile_label,
        preferredName: pairing.preferred_name,
        status: pairing.status,
        localProfileCode: `WEB-${pairing.approved_profile_id.replaceAll("-", "").slice(0, 12).toUpperCase()}`,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
