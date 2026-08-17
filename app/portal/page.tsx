import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { profilesForUser } from "@/lib/portal-store";
import { demoProfileForLabel } from "@/lib/demo-profiles";
import PortalBar from "@/app/components/PortalBar";
import PortalNotice from "@/app/components/PortalNotice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Family portal" };

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const user = await requireUser("/portal");
  const profiles = await profilesForUser(user.id, user.role === "admin");
  const params = await searchParams;
  return <section className="portal-shell shell shell--wide">
    <PortalBar user={user} /><PortalNotice error={params.error} notice={params.notice} />
    <div className="portal-heading"><div><p className="eyebrow">Private Care Circle</p><h1>People, memories, and support—shared with permission.</h1></div><p>Only profiles explicitly assigned to this account appear here. Conversation transcripts and raw audio are never part of this portal.</p></div>
    {profiles.length ? <div className="portal-profile-grid">{profiles.map((profile) => {
      const demoProfile = demoProfileForLabel(profile.profileLabel);
      return <Link className={`portal-profile-card${demoProfile ? " portal-profile-card--demo" : ""}`} href={`/portal/profile/${profile.id}`} key={profile.id}>
        <div className="portal-profile-card__top"><span className="portal-status">{demoProfile ? "synthetic demo" : profile.status}</span><span>{profile.relationship}</span></div>
        <p className="eyebrow">{demoProfile?.accent ?? "Private profile"}</p>
        <h2>{demoProfile?.preferredName ?? profile.profileLabel}</h2><p>{demoProfile?.summary ?? (profile.preferredName ? `Preferred name: ${profile.preferredName}` : "No personal display name stored.")}</p>
        <span className="product-link">{demoProfile ? "Explore Soni’s potential" : "Open profile"} <span aria-hidden="true">›</span></span>
      </Link>;
    })}</div> : <div className="portal-empty"><p className="eyebrow">Nothing shared yet</p><h2>No profiles are connected to this account.</h2><p>{user.role === "admin" ? "Create the first privacy-first profile from administration." : "An administrator can connect you to a senior-approved profile."}</p>{user.role === "admin" && <Link className="button button--dark" href="/portal/admin">Open administration</Link>}</div>}
  </section>;
}
