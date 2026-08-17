import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import PortalBar from "@/app/components/PortalBar";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Change password" };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/portal/password"); const params = await searchParams;
  return <section className="portal-shell shell"><PortalBar user={user} /><div className="portal-auth portal-auth--inside"><div className="portal-auth__card"><p className="eyebrow">Account security</p><h1>{user.mustChangePassword ? "Choose your private password." : "Change your password."}</h1><p className="portal-auth__intro">Use at least 12 characters. Changing it signs out every device connected to this account.</p><PortalNotice error={params.error} /><form className="portal-form" action="/api/auth/password" method="post"><label>Current password<input name="currentPassword" type="password" required minLength={12} maxLength={128} autoComplete="current-password" /></label><label>New password<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><button className="button button--dark" type="submit">Change password</button></form></div></div></section>;
}
