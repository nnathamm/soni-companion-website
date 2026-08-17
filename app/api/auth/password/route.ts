import { destroySession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { portalError } from "@/lib/route-helpers";
import { assertSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser("/portal/password");
    const form = await request.formData();
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const rows = await db()<{ password_hash: string }[]>`SELECT password_hash FROM users WHERE id = ${user.id}`;
    if (!rows[0] || !(await verifyPassword(currentPassword, rows[0].password_hash))) throw new Error("invalid_credentials");
    const passwordHash = await hashPassword(newPassword);
    await db()`UPDATE users SET password_hash = ${passwordHash}, must_change_password = false, updated_at = now() WHERE id = ${user.id}`;
    await db()`DELETE FROM sessions WHERE user_id = ${user.id}`;
    await destroySession();
    return NextResponse.redirect(new URL("/portal/login?notice=password_changed", request.url), 303);
  } catch (error) {
    return portalError(request.url, "/portal/password", error);
  }
}
