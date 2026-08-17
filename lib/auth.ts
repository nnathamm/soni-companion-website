import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, databaseConfigured } from "./db";
import { tokenHash } from "./security";
import { AUTH_STATE_COOKIE_NAME } from "./auth-state";

const SESSION_DAYS = 7;
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-soni_session" : "soni_session";

export type PortalUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
  mustChangePassword: boolean;
};

export async function setupAvailable() {
  if (!databaseConfigured()) return false;
  const sql = db();
  const rows = await sql<{ available: boolean }[]>`
    SELECT
      NOT EXISTS (SELECT 1 FROM users)
      AND EXISTS (
        SELECT 1 FROM admin_setup_tokens
        WHERE used_at IS NULL AND expires_at > now()
      ) AS available
  `;
  return rows[0]?.available === true;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const sql = db();
  await sql`DELETE FROM sessions WHERE expires_at <= now()`;
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash(token)}, ${userId}, ${expiresAt})`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  cookieStore.set(AUTH_STATE_COOKIE_NAME, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token && databaseConfigured()) {
    await db()`DELETE FROM sessions WHERE token_hash = ${tokenHash(token)}`;
  }
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(AUTH_STATE_COOKIE_NAME);
}

export async function currentUser(): Promise<PortalUser | null> {
  if (!databaseConfigured()) return null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await db()<{
    id: string;
    email: string;
    display_name: string;
    role: "admin" | "member";
    must_change_password: boolean;
  }[]>`
    SELECT u.id, u.email, u.display_name, u.role, u.must_change_password
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash(token)}
      AND s.expires_at > now()
      AND u.active = true
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
  };
}

export async function requireUser(returnTo = "/portal") {
  const user = await currentUser();
  if (!user) redirect(`/portal/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (user.mustChangePassword && returnTo !== "/portal/password") redirect("/portal/password");
  return user;
}

export async function requireAdmin(returnTo = "/portal/admin") {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") redirect("/portal?error=admin_required");
  return user;
}
