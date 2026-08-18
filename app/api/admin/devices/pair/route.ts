import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/portal-store";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, isUuid } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let profileId = "";
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const form = await request.formData();
    profileId = String(form.get("profileId") ?? "");
    const pairingCode = String(form.get("pairingCode") ?? "").replace(/\D/g, "").slice(0, 6);
    if (!isUuid(profileId) || !/^[0-9]{6}$/.test(pairingCode)) throw new Error("invalid_pairing_code");

    const sql = db();
    const paired = await sql.begin(async (transaction) => {
      const requests = await transaction<{
        id: string;
        device_id: string;
        token_hash: string;
        device_name: string;
        software_version: string;
      }[]>`
        SELECT id, device_id, token_hash, device_name, software_version
        FROM device_pairing_requests
        WHERE pairing_code = ${pairingCode}
          AND expires_at > now()
          AND approved_at IS NULL
        FOR UPDATE
      `;
      const pairing = requests[0];
      if (!pairing) throw new Error("invalid_pairing_code");
      const profiles = await transaction<{ id: string }[]>`
        SELECT id FROM senior_profiles WHERE id = ${profileId} AND status <> 'archived' LIMIT 1
      `;
      if (!profiles[0]) throw new Error("not_found");
      const devices = await transaction<{ id: string }[]>`
        INSERT INTO household_devices (
          profile_id, device_id, token_hash, device_name, software_version, status, paired_by,
          paired_at, last_seen_at, last_sync_at, revoked_at, updated_at
        ) VALUES (
          ${profileId}, ${pairing.device_id}, ${pairing.token_hash}, ${pairing.device_name},
          ${pairing.software_version}, 'active', ${admin.id}, now(), NULL, NULL, NULL, now()
        )
        ON CONFLICT (device_id) DO UPDATE SET
          profile_id = EXCLUDED.profile_id,
          token_hash = EXCLUDED.token_hash,
          device_name = EXCLUDED.device_name,
          software_version = EXCLUDED.software_version,
          status = 'active',
          paired_by = EXCLUDED.paired_by,
          paired_at = now(),
          revoked_at = NULL,
          updated_at = now()
        RETURNING id
      `;
      await transaction`
        UPDATE device_pairing_requests SET
          approved_profile_id = ${profileId}, approved_by = ${admin.id}, approved_at = now()
        WHERE id = ${pairing.id}
      `;
      return { deviceId: devices[0].id, name: pairing.device_name };
    });
    await writeAudit(admin.id, "device.paired", profileId, { deviceId: paired.deviceId, deviceName: paired.name });
    return NextResponse.redirect(new URL(`/portal/profile/${profileId}?notice=device_paired`, request.url), 303);
  } catch (error) {
    return portalError(request.url, isUuid(profileId) ? `/portal/profile/${profileId}` : "/portal/admin", error);
  }
}
