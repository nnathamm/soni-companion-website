import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureKeys, type FeatureKey } from "@/lib/features";
import { writeAudit } from "@/lib/portal-store";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, isUuid } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const form = await request.formData();
    const profileId = String(form.get("profileId") ?? "");
    const featureKey = String(form.get("featureKey") ?? "") as FeatureKey;
    const enabled = form.get("enabled") === "true";
    if (!isUuid(profileId) || !featureKeys.has(featureKey)) throw new Error("invalid_input");
    await db()`
      INSERT INTO feature_permissions (profile_id, feature_key, enabled, approved_by, approved_at, updated_at)
      VALUES (${profileId}, ${featureKey}, ${enabled}, ${enabled ? admin.id : null}, ${enabled ? new Date() : null}, now())
      ON CONFLICT (profile_id, feature_key) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        updated_at = now()
    `;
    await writeAudit(admin.id, enabled ? "permission.enabled" : "permission.disabled", profileId, { featureKey });
    return NextResponse.redirect(new URL(`/portal/profile/${profileId}?notice=permission_updated`, request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/admin", error);
  }
}
