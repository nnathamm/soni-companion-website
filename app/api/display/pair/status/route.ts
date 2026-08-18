import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { bearerToken, validateDeviceToken } from "@/lib/device-auth";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestId = new URL(request.url).searchParams.get("requestId") ?? "";
    if (!isUuid(requestId)) throw new Error("invalid_input");
    const token = validateDeviceToken(bearerToken(request));
    const rows = await db()<{
      approved_profile_id: string | null; profile_label: string | null; preferred_name: string | null; expires_at: string;
    }[]>`
      SELECT r.approved_profile_id, p.profile_label, p.preferred_name, r.expires_at::text
      FROM remote_display_pairing_requests r
      LEFT JOIN senior_profiles p ON p.id=r.approved_profile_id
      WHERE r.id=${requestId} AND r.display_id=${token.deviceId} AND r.token_hash=${token.hash} AND r.expires_at > now()
      LIMIT 1
    `;
    const pairing = rows[0];
    if (!pairing) throw new Error("pairing_expired");
    if (!pairing.approved_profile_id) return Response.json({ ok: true, state: "pending", expiresAt: pairing.expires_at }, { headers: { "Cache-Control": "no-store" } });
    await db()`UPDATE remote_display_pairing_requests SET claimed_at=COALESCE(claimed_at, now()) WHERE id=${requestId}`;
    return Response.json({ ok: true, state: "approved", profile: {
      id: pairing.approved_profile_id, label: pairing.profile_label, preferredName: pairing.preferred_name,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
