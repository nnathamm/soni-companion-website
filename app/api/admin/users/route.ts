import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, cleanText, normalizeEmail } from "@/lib/security";
import { writeAudit } from "@/lib/portal-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const form = await request.formData();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const displayName = cleanText(String(form.get("displayName") ?? ""), 80);
    const temporaryPassword = String(form.get("temporaryPassword") ?? "");
    if (!email.includes("@") || !displayName) throw new Error("invalid_input");
    const passwordHash = await hashPassword(temporaryPassword);
    const rows = await db()<{ id: string }[]>`
      INSERT INTO users (email, display_name, password_hash, role, must_change_password)
      VALUES (${email}, ${displayName}, ${passwordHash}, 'member', true)
      RETURNING id
    `;
    await writeAudit(admin.id, "user.created", null, { userId: rows[0].id });
    return NextResponse.redirect(new URL("/portal/admin?notice=member_created", request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/admin", error);
  }
}
