import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { profileForUser } from "@/lib/portal-store";
import { demoProfileForLabel } from "@/lib/demo-profiles";
import DemoProfileExperience from "@/app/components/DemoProfileExperience";
import PortalBar from "@/app/components/PortalBar";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shared profile" };

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/portal/profile/${id}`);
  const profile = await profileForUser(id, user.id, user.role === "admin");
  if (!profile) notFound();
  const demoProfile = demoProfileForLabel(profile.profileLabel);
  const query = await searchParams;
  return <section className="portal-shell shell shell--wide">
    <PortalBar user={user} /><PortalNotice error={query.error} notice={query.notice} />
    <div className="profile-hero"><div><p className="eyebrow">{demoProfile ? "Synthetic showcase profile" : "Senior-controlled profile"}</p><h1>{demoProfile?.preferredName ?? profile.profileLabel}</h1><p>{demoProfile ? `${demoProfile.location} · ${demoProfile.summary}` : profile.preferredName ? `Preferred name: ${profile.preferredName}` : "This profile uses a pseudonymous label."}</p></div><div className="profile-hero__facts"><span><strong>{profile.status}</strong>Profile status</span><span><strong>{profile.privacyMode}</strong>Privacy mode</span><span><strong>{profile.relationship}</strong>Your access</span></div></div>
    {demoProfile && <DemoProfileExperience profile={demoProfile} enabledFeatures={profile.features.filter((feature) => feature.enabled).map((feature) => feature.key)} />}
    <div className="profile-boundary"><div><p className="eyebrow">Privacy boundary</p><h2>Features are separate—not a single blanket permission.</h2></div><p>Turning one on does not authorize another. Physical privacy sleep on Soni still overrides microphone-dependent features.</p></div>
    <div className="profile-feature-grid">{profile.features.map((feature) => <article key={feature.key} className={feature.enabled ? "is-enabled" : ""}>
      <div className="profile-feature__top"><span>{feature.eyebrow}</span><span className="portal-status">{feature.enabled ? "enabled" : "off"}</span></div><h2>{feature.title}</h2><p>{feature.description}</p><div className="platform-boundary"><strong>Boundary</strong><span>{feature.boundary}</span></div>
      {user.role === "admin" && <form action="/api/admin/permissions" method="post"><input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="featureKey" value={feature.key} /><input type="hidden" name="enabled" value={feature.enabled ? "false" : "true"} /><button className={feature.enabled ? "portal-outline-button" : "button button--dark"} type="submit">{feature.enabled ? "Turn off" : "Enable with approval"}</button></form>}
    </article>)}</div>
    {user.role === "admin" && <section className="portal-panel portal-panel--wide portal-membership"><p className="eyebrow">Care Circle access</p><h2>Connect an invited account</h2><p className="portal-muted">The account must already exist. Assign only the relationship the senior has approved.</p><form className="portal-inline-form" action="/api/admin/memberships" method="post"><input type="hidden" name="profileId" value={profile.id} /><label>Email<input name="email" type="email" required /></label><label>Relationship<select name="relationship" defaultValue="family"><option value="senior">Senior</option><option value="family">Family</option><option value="caregiver">Caregiver</option><option value="coordinator">Coordinator</option></select></label><button className="button button--dark" type="submit">Assign access</button></form></section>}
  </section>;
}
