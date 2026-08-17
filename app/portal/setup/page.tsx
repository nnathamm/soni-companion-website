import type { Metadata } from "next";
import { setupAvailable } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator setup" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await setupAvailable())) redirect("/portal/login?error=setup_unavailable");
  const params = await searchParams;
  return <section className="portal-auth"><div className="portal-auth__card">
    <p className="eyebrow">One-time administrator setup</p><h1>Create the first Soni administrator.</h1>
    <p className="portal-auth__intro">This protected step works only before any account exists. Public registration stays closed afterward.</p>
    <PortalNotice error={params.error} />
    <form className="portal-form" action="/api/auth/setup" method="post">
      <label>Your name<input name="displayName" required maxLength={80} autoComplete="name" /></label>
      <label>Your email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>New administrator password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
      <label>Private setup code<input name="setupCode" type="password" required autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} /><small>Paste the complete code. Accidental spaces before or after it are ignored.</small></label>
      <button className="button button--dark" type="submit">Create administrator</button>
    </form>
  </div></section>;
}
