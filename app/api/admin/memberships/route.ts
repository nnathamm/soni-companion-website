import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/portal-store";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, isUuid, normalizeEmail } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const form = await request.formData();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const profileId = String(form.get("profileId") ?? "");
    const relationshipValue = String(form.get("relationship") ?? "family");
    const relationship = ["senior", "family", "caregiver", "coordinator"].includes(relationshipValue) ? relationshipValue : "family";
    if (!email.includes("@") || !isUuid(profileId)) throw new Error("invalid_input");
    const users = await db()<{ id: string }[]>`SELECT id FROM users WHERE email = ${email} AND active = true LIMIT 1`;
    if (!users[0]) throw new Error("not_found");
    await db()`
      INSERT INTO profile_memberships (profile_id, user_id, relationship)
      VALUES (${profileId}, ${users[0].id}, ${relationship})
      ON CONFLICT (profile_id, user_id) DO UPDATE SET relationship = EXCLUDED.relationship
    `;
    await writeAudit(admin.id, "membership.assigned", profileId, { userId: users[0].id, relationship });
    return NextResponse.redirect(new URL(`/portal/profile/${profileId}?notice=member_assigned`, request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/admin", error);
  }
}
