import { tokenHash, assertSameOrigin, cleanText, normalizeEmail } from "@/lib/security";
import { hashPassword } from "@/lib/password";
import { createSession, setupAvailable } from "@/lib/auth";
import { db } from "@/lib/db";
import { portalError } from "@/lib/route-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (!(await setupAvailable())) throw new Error("setup_unavailable");
    const form = await request.formData();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const displayName = cleanText(String(form.get("displayName") ?? ""), 80);
    const password = String(form.get("password") ?? "");
    const setupCode = String(form.get("setupCode") ?? "").trim();
    if (!email.includes("@") || !displayName || setupCode.length < 32) throw new Error("invalid_input");
    const passwordHash = await hashPassword(password);
    const userId = await db().begin(async (sql) => {
      const tokenRows = await sql<{ token_hash: string }[]>`
        UPDATE admin_setup_tokens
        SET used_at = now()
        WHERE token_hash = ${tokenHash(setupCode)}
          AND used_at IS NULL
          AND expires_at > now()
          AND NOT EXISTS (SELECT 1 FROM users)
        RETURNING token_hash
      `;
      if (!tokenRows[0]) throw new Error("invalid_setup_code");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO users (email, display_name, password_hash, role, must_change_password)
        VALUES (${email}, ${displayName}, ${passwordHash}, 'admin', false)
        RETURNING id
      `;
      await sql`INSERT INTO audit_events (actor_id, action) VALUES (${rows[0].id}, 'admin.setup_completed')`;
      return rows[0].id;
    });
    await createSession(userId);
    return NextResponse.redirect(new URL("/portal/admin?notice=setup_complete", request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/setup", error);
  }
}
