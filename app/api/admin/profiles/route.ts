import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { companionFeatures } from "@/lib/features";
import { writeAudit } from "@/lib/portal-store";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const form = await request.formData();
    const profileLabel = cleanText(String(form.get("profileLabel") ?? ""), 80);
    const preferredName = cleanText(String(form.get("preferredName") ?? ""), 80) || null;
    const privacyMode = form.get("privacyMode") === "standard" ? "standard" : "strict";
    if (!profileLabel) throw new Error("invalid_input");
    const rows = await db()<{ id: string }[]>`
      INSERT INTO senior_profiles (profile_label, preferred_name, privacy_mode, created_by)
      VALUES (${profileLabel}, ${preferredName}, ${privacyMode}, ${admin.id})
      RETURNING id
    `;
    const profileId = rows[0].id;
    const sql = db();
    await sql.begin(async (transaction) => {
      for (const feature of companionFeatures) {
        await transaction`INSERT INTO feature_permissions (profile_id, feature_key, enabled) VALUES (${profileId}, ${feature.key}, false)`;
      }
    });
    await writeAudit(admin.id, "profile.created", profileId, { privacyMode });
    return NextResponse.redirect(new URL(`/portal/profile/${profileId}?notice=profile_created`, request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/admin", error);
  }
}
