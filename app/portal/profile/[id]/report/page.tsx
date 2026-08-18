import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintReportButton from "@/app/components/PrintReportButton";
import PortalBar from "@/app/components/PortalBar";
import { requireUser } from "@/lib/auth";
import { householdWorkspace } from "@/lib/household-content";
import { profileForUser } from "@/lib/portal-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Care planning report", robots: { index: false, follow: false } };

export default async function CareReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/portal/profile/${id}/report`);
  const profile = await profileForUser(id, user.id, user.role === "admin");
  if (!profile) notFound();
  const workspace = await householdWorkspace(id);
  const name = profile.preferredName ?? profile.profileLabel;
  const start = workspace.trends[0]?.date;
  const end = workspace.trends.at(-1)?.date;
  const totals = workspace.trends.reduce((result, day) => ({
    conversations: result.conversations + day.conversations,
    medicationDue: result.medicationDue + day.medicationDue,
    medicationAcknowledged: result.medicationAcknowledged + day.medicationAcknowledged,
    activities: result.activities + day.activities,
  }), { conversations: 0, medicationDue: 0, medicationAcknowledged: 0, activities: 0 });
  const notable = workspace.trends.flatMap((day) => day.notableChanges.map((change: unknown) => ({ date: day.date, change })));

  return <main className="care-report shell shell--wide">
    <div className="report-screen-only"><PortalBar user={user} /></div>
    <header className="care-report-header"><div><p className="eyebrow">Soni Care Circle</p><h1>{name}’s care-planning report</h1><p>{start && end ? `${start} through ${end}` : "Awaiting the first longitudinal summary"}</p></div><PrintReportButton /></header>
    <section className="care-report-note"><strong>Descriptive, not diagnostic.</strong><p>This report organizes daily aggregate patterns and family-created plans. It does not diagnose a condition, predict an emergency, or replace a qualified clinical assessment. No raw audio is included.</p></section>
    <section className="care-report-metrics"><article><strong>{totals.conversations}</strong><span>conversations</span></article><article><strong>{totals.activities}</strong><span>accepted activities</span></article><article><strong>{totals.medicationDue ? `${Math.round(totals.medicationAcknowledged / totals.medicationDue * 100)}%` : "—"}</strong><span>reminders acknowledged</span></article><article><strong>{workspace.trends.length}</strong><span>days summarized</span></article></section>
    <section className="care-report-section"><h2>Longitudinal indicators</h2><div className="care-report-table"><div className="care-report-table__head"><span>Date</span><span>Conversations</span><span>Words / turn</span><span>Vocabulary</span><span>Pauses</span><span>Tone</span></div>{workspace.trends.map((day) => <div key={day.date}><strong>{day.date}</strong><span>{day.conversations}</span><span>{day.wordsPerTurn?.toFixed(1) ?? "—"}</span><span>{day.vocabulary?.toFixed(2) ?? "—"}</span><span>{day.pauses?.toFixed(1) ?? "—"}</span><span>{day.tone?.toFixed(2) ?? "—"}</span></div>)}</div></section>
    <section className="care-report-grid"><div className="care-report-section"><h2>Human-review notes</h2>{notable.length ? notable.map((item, index) => <article key={`${item.date}-${index}`}><strong>{item.date}</strong><p>{typeof item.change === "object" && item.change !== null ? JSON.stringify(item.change) : String(item.change)}</p></article>) : <p>No derived indicator crossed a configured descriptive threshold in this reporting window.</p>}</div><div className="care-report-section"><h2>Current shared plan</h2>{workspace.plans.length ? workspace.plans.map((item) => <article key={item.id}><span>{item.category} · {item.priority}</span><h3>{item.title}</h3><p>{item.details}</p><strong>{item.status}</strong></article>) : <p>No shared care-plan items yet.</p>}</div></section>
    <footer className="care-report-footer">Generated {new Date().toLocaleString()} · Soni Companion · Family review required</footer>
  </main>;
}
