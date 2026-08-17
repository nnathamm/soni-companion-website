import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminOverview } from "@/lib/portal-store";
import PortalBar from "@/app/components/PortalBar";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portal administration" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const user = await requireAdmin();
  const overview = await adminOverview();
  const params = await searchParams;
  return <section className="portal-shell shell shell--wide">
    <PortalBar user={user} /><PortalNotice error={params.error} notice={params.notice} />
    <div className="portal-heading portal-heading--compact"><div><p className="eyebrow">Administrator</p><h1>Keep access intentional.</h1></div><p>Create only the people and pseudonymous profiles Soni needs. Sensitive capabilities begin off.</p></div>
    <div className="portal-stat-grid"><article><strong>{overview.counts.profiles}</strong><span>Active profiles</span></article><article><strong>{overview.counts.users}</strong><span>Portal accounts</span></article><article><strong>{overview.counts.memberships}</strong><span>Profile connections</span></article></div>
    <div className="portal-admin-grid">
      <section className="portal-panel"><p className="eyebrow">New profile</p><h2>Create a senior-controlled profile</h2><form className="portal-form" action="/api/admin/profiles" method="post">
        <label>Pseudonymous profile label<input name="profileLabel" required maxLength={80} placeholder="Household profile 01" /></label>
        <label>Preferred name <span>(optional)</span><input name="preferredName" maxLength={80} /></label>
        <label>Privacy mode<select name="privacyMode" defaultValue="strict"><option value="strict">Strict — recommended</option><option value="standard">Standard</option></select></label>
        <button className="button button--dark" type="submit">Create profile</button>
      </form></section>
      <section className="portal-panel"><p className="eyebrow">New family access</p><h2>Create an invited account</h2><form className="portal-form" action="/api/admin/users" method="post">
        <label>Person’s name<input name="displayName" required maxLength={80} /></label><label>Email address<input name="email" type="email" required maxLength={254} /></label>
        <label>Temporary password<input name="temporaryPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><small>Share privately. They must replace it at first sign-in.</small></label>
        <button className="button button--dark" type="submit">Create invited account</button>
      </form></section>
    </div>
    <section className="portal-panel portal-panel--wide"><div className="portal-panel__heading"><div><p className="eyebrow">Profiles</p><h2>Permission and membership controls</h2></div></div>
      {overview.profiles.length ? <div className="portal-table-list">{overview.profiles.map((profile) => <Link href={`/portal/profile/${profile.id}`} key={String(profile.id)}><strong>{String(profile.profile_label)}</strong><span>{String(profile.status)} · {String(profile.privacy_mode)} privacy</span><span aria-hidden="true">›</span></Link>)}</div> : <p className="portal-muted">No profiles yet.</p>}
    </section>
    <section className="portal-panel portal-panel--wide"><p className="eyebrow">Accounts</p><h2>Current portal members</h2>
      <div className="portal-table-list">{overview.users.map((member) => <div key={String(member.id)}><strong>{String(member.display_name)}</strong><span>{String(member.email)} · {String(member.role)}{member.must_change_password ? " · password change required" : ""}</span><span className="portal-status">{member.active ? "active" : "disabled"}</span></div>)}</div>
    </section>
  </section>;
}
