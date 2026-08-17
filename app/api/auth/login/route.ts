import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearLoginFailures, loginAllowed, recordLoginFailure } from "@/lib/login-rate";
import { verifyPassword } from "@/lib/password";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin, normalizeEmail, safeReturnTo } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let email = "";
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const returnTo = safeReturnTo(form.get("returnTo"));
    if (!(await loginAllowed(email))) throw new Error("rate_limited");
    const rows = await db()<{
      id: string; password_hash: string; active: boolean; must_change_password: boolean;
    }[]>`SELECT id, password_hash, active, must_change_password FROM users WHERE email = ${email} LIMIT 1`;
    const user = rows[0];
    if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) {
      await recordLoginFailure(email);
      throw new Error("invalid_credentials");
    }
    await clearLoginFailures(email);
    await createSession(user.id);
    await db()`INSERT INTO audit_events (actor_id, action) VALUES (${user.id}, 'auth.login')`;
    return NextResponse.redirect(new URL(user.must_change_password ? "/portal/password" : returnTo, request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/login", error);
  }
}
