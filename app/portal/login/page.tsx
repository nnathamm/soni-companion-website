import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, setupAvailable } from "@/lib/auth";
import { databaseConfigured } from "@/lib/db";
import { redirect } from "next/navigation";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; returnTo?: string }> }) {
  if (await currentUser()) redirect("/portal");
  const params = await searchParams;
  const configured = databaseConfigured();
  let canSetup = false;
  if (configured) {
    try { canSetup = await setupAvailable(); } catch { canSetup = false; }
  }
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "/portal";
  return (
    <section className="portal-auth"><div className="portal-auth__card">
      <p className="eyebrow">Private family access</p><h1>Welcome to Soni’s Care Circle.</h1>
      <p className="portal-auth__intro">Sign in from a trusted device to view only the profiles and information shared with you.</p>
      <PortalNotice error={params.error} notice={params.notice} />
      {configured ? <form className="portal-form" action="/api/auth/login" method="post">
        <input type="hidden" name="returnTo" value={returnTo} />
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={12} maxLength={128} /></label>
        <button className="button button--dark" type="submit">Sign in securely</button>
      </form> : <div className="portal-setup-note"><strong>Portal connection in progress</strong><p>The public information site is available. Private profiles remain closed until protected storage is connected.</p></div>}
      {canSetup && <p className="portal-auth__footer"><Link href="/portal/setup">Create the first administrator account</Link></p>}
    </div></section>
  );
}
