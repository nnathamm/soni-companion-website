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
    const deviceId = String(form.get("deviceId") ?? "");
    if (!isUuid(profileId) || !isUuid(deviceId)) throw new Error("invalid_input");
    const rows = await db()<{ id: string }[]>`
      UPDATE household_devices SET status = 'revoked', revoked_at = now(), updated_at = now()
      WHERE id = ${deviceId} AND profile_id = ${profileId} AND status = 'active'
      RETURNING id
    `;
    if (!rows[0]) throw new Error("not_found");
    await writeAudit(admin.id, "device.revoked", profileId, { deviceId });
    return NextResponse.redirect(new URL(`/portal/profile/${profileId}?notice=device_revoked`, request.url), 303);
  } catch (error) {
    return portalError(request.url, isUuid(profileId) ? `/portal/profile/${profileId}` : "/portal/admin", error);
  }
}
