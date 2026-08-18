"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { FormEvent, useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { HouseholdWorkspace as Workspace } from "@/lib/household-content";

type Props = {
  profileId: string;
  preferredName: string;
  initialWorkspace: Workspace;
  canManage: boolean;
  piDevices: Array<{ name: string; online: boolean; lastSyncAt: string | null }>;
};

type Tab = "today" | "memories" | "medications" | "care" | "displays" | "insights" | "setup";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "today", label: "Today" },
  { key: "memories", label: "Memories & facts" },
  { key: "medications", label: "Medication" },
  { key: "care", label: "Care plan" },
  { key: "displays", label: "TV & devices" },
  { key: "insights", label: "Insights" },
  { key: "setup", label: "Setup" },
];

function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form));
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="workspace-empty">More days are needed to show a trend.</p>;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 240},${55 - ((value - minimum) / spread) * 45}`).join(" ");
  return <svg className="workspace-sparkline" viewBox="0 0 240 64" role="img" aria-label="Trend over time"><polyline points={points} /></svg>;
}

export default function HouseholdWorkspace({ profileId, preferredName, initialWorkspace, canManage, piDevices }: Props) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [tab, setTab] = useState<Tab>("today");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const uploadInput = useRef<HTMLInputElement>(null);

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setError("");
    const response = await fetch(`/api/profile/${profileId}/content`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const payload = await response.json() as { ok?: boolean; error?: string; workspace?: Workspace };
    if (!response.ok || !payload.workspace) throw new Error(payload.error ?? "request_failed");
    setWorkspace(payload.workspace);
  }, [profileId]);

  function submitAction(event: FormEvent<HTMLFormElement>, action: string, transform?: (values: Record<string, FormDataEntryValue>) => Record<string, unknown>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    startTransition(async () => {
      try {
        await mutate({ action, ...(transform ? transform(values) : values) });
        form.reset();
        setNotice("Saved and queued for Soni’s next sync.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "request_failed");
      }
    });
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const file = uploadInput.current?.files?.[0];
    if (!file) return;
    setError("");
    setNotice("Uploading securely…");
    try {
      const tags = String(values.tags ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      const safeFilename = file.name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-100) || "family-photo";
      await upload(`households/${profileId}/${safeFilename}`, file, {
        access: "private",
        handleUploadUrl: `/api/profile/${profileId}/media/upload`,
        clientPayload: JSON.stringify({
          title: values.title, caption: values.caption, storyDate: values.storyDate, tags, size: file.size,
        }),
        contentType: file.type,
      });
      const refreshed = await fetch(`/api/profile/${profileId}/content`, { cache: "no-store" });
      const payload = await refreshed.json() as { workspace?: Workspace };
      if (payload.workspace) setWorkspace(payload.workspace);
      form.reset();
      setNotice("Photo uploaded. Soni receives its story details; paired displays stream the image directly from private cloud storage.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "upload_failed");
    }
  }

  async function removeMedia(mediaId: string) {
    setError("");
    const response = await fetch(`/api/profile/${profileId}/media/${mediaId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json() as { error?: string };
      setError(payload.error ?? "request_failed");
      return;
    }
    setWorkspace((current) => ({ ...current, media: current.media.filter((item) => item.id !== mediaId) }));
    setNotice("Photo removed from private cloud storage.");
  }

  async function pairDisplay() {
    setError("");
    const response = await fetch(`/api/profile/${profileId}/displays/pair`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pairingCode }),
    });
    const payload = await response.json() as { error?: string; workspace?: Workspace };
    if (!response.ok || !payload.workspace) {
      setError(payload.error ?? "request_failed");
      return;
    }
    setWorkspace(payload.workspace);
    setPairingCode("");
    setNotice("Display connected.");
  }

  async function showSetupQr() {
    const QRCode = await import("qrcode");
    setQrCode(await QRCode.toDataURL(`${window.location.origin}/display`, { width: 260, margin: 1, color: { dark: "#17272f", light: "#ffffff" } }));
  }

  const medicationAdherence = useMemo(() => {
    const totals = workspace.trends.reduce((result, day) => ({ due: result.due + day.medicationDue, acknowledged: result.acknowledged + day.medicationAcknowledged }), { due: 0, acknowledged: 0 });
    return totals.due ? Math.round((totals.acknowledged / totals.due) * 100) : null;
  }, [workspace.trends]);
  const connected = piDevices.some((device) => device.online);
  const displayOnline = workspace.displays.some((display) => display.online);

  return <section className="household-workspace" aria-label={`${preferredName} household workspace`}>
    <div className="workspace-header">
      <div><p className="eyebrow">Live household workspace</p><h2>Everything Soni can use, in one place.</h2><p>Content changes sync as structured data. Photos remain in private cloud storage and stream directly to paired screens.</p></div>
      <div className="workspace-health"><span className={connected ? "is-good" : ""}>{connected ? "Soni online" : "Soni offline"}</span><span className={displayOnline ? "is-good" : ""}>{displayOnline ? "Display online" : "No live display"}</span></div>
    </div>
    <nav className="workspace-tabs" aria-label="Profile tools">{tabs.map((item) => <button key={item.key} type="button" aria-current={tab === item.key ? "page" : undefined} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
    {notice ? <p className="workspace-notice" role="status">{notice}</p> : null}
    {error ? <p className="workspace-error" role="alert">Could not complete that action: {error.replaceAll("_", " ")}.</p> : null}

    {tab === "today" ? <div className="workspace-stack"><div className="workspace-grid workspace-grid--today">
      <article className="workspace-card workspace-card--feature"><p className="eyebrow">Ready today</p><h3>{workspace.notifications.filter((item) => item.status === "scheduled").length} upcoming reminders</h3><p>{workspace.medications.filter((item) => item.enabled).length} medication schedules and {workspace.plans.filter((item) => item.status !== "completed").length} active care-plan items are available to the household.</p></article>
      <article className="workspace-card"><span className="workspace-metric">{workspace.media.length}</span><strong>family memories</strong><p>Photos can be woven into conversation and shown on a paired TV without touching Pi storage.</p></article>
      <article className="workspace-card"><span className="workspace-metric">{workspace.facts.length}</span><strong>family facts</strong><p>Names, places, traditions, and story context that help Soni respond personally.</p></article>
      <article className="workspace-card"><span className="workspace-metric">{medicationAdherence === null ? "—" : `${medicationAdherence}%`}</span><strong>reminder follow-through</strong><p>Derived from acknowledgements; not medical advice or a diagnosis.</p></article>
    </div><div className="workspace-grid workspace-grid--split">
      {canManage ? <form className="workspace-form" onSubmit={(event) => submitAction(event, "notification.create", (values) => ({ ...values, scheduledFor: new Date(String(values.scheduledFor)).toISOString() }))}><h3>Send a remote reminder</h3><label>Type<select name="kind"><option value="reminder">Reminder</option><option value="family_update">Family update</option><option value="appointment">Appointment</option><option value="check_in">Check-in</option></select></label><label>Title<input name="title" maxLength={100} required placeholder="Call with Sarah" /></label><label>Message<textarea name="message" maxLength={400} rows={3} placeholder="We’ll call after dinner." /></label><label>Delivery time<input name="scheduledFor" type="datetime-local" required /></label><button className="button button--dark" disabled={isPending} type="submit">Schedule reminder</button><small>Soni will show this locally and on paired displays, and speak it in her established ElevenLabs voice.</small></form> : null}
      <div className="workspace-list"><h3>Remote reminders</h3>{workspace.notifications.length ? workspace.notifications.map((item) => <article key={item.id}><div><span>{item.kind.replaceAll("_", " ")} · {new Date(item.scheduledFor).toLocaleString()}</span><strong>{item.title}</strong><p>{item.message}</p></div>{canManage && item.status === "scheduled" ? <button type="button" onClick={() => mutate({ action: "notification.cancel", id: item.id })}>Cancel</button> : <span>{item.status}</span>}</article>) : <p className="workspace-empty">No remote reminders have been scheduled.</p>}</div>
    </div></div> : null}

    {tab === "memories" ? <div className="workspace-stack">
      {canManage ? <div className="workspace-grid workspace-grid--forms">
        <form className="workspace-form" onSubmit={uploadPhoto}><h3>Add a family photo</h3><label>Photo<input ref={uploadInput} name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required /></label><label>Title<input name="title" maxLength={100} required placeholder="Summer at Lake Michigan" /></label><label>Story or caption<textarea name="caption" maxLength={500} rows={3} placeholder="Who is here, when it happened, and why it matters" /></label><div className="workspace-form-row"><label>Date<input name="storyDate" type="date" /></label><label>Tags<input name="tags" placeholder="family, travel, 1978" /></label></div><button className="button button--dark" disabled={isPending} type="submit">Upload privately</button><small>JPEG, PNG, WebP, or GIF up to 12 MB. The Pi receives only title, caption, date, tags, and an ID.</small></form>
        <form className="workspace-form" onSubmit={(event) => submitAction(event, "fact.create")}><h3>Add a family fact</h3><label>Fact<textarea name="text" maxLength={500} rows={5} required placeholder={`${preferredName} met Joan at the neighborhood garden club.`} /></label><label>Source<input name="source" maxLength={80} defaultValue="Family" /></label><button className="button button--dark" disabled={isPending} type="submit">Save fact</button></form>
      </div> : null}
      <div className="workspace-media-grid">{workspace.media.map((item) => <article key={item.id}><div className="workspace-media-image"><Image src={item.previewUrl} alt={item.caption || item.title} fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized /></div><div><span>{item.storyDate || "Family memory"}</span><h3>{item.title}</h3><p>{item.caption || "No story has been added yet."}</p><div className="workspace-chip-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{canManage ? <div className="workspace-actions"><button type="button" onClick={() => mutate({ action: "display.command", mode: "memory", mediaId: item.id, title: item.title, caption: item.caption }).then(() => setNotice("Memory sent to every paired display."))}>Show on TV</button><button type="button" onClick={() => removeMedia(item.id)}>Remove</button></div> : null}</div></article>)}</div>
      <div className="workspace-list"><h3>Saved facts</h3>{workspace.facts.length ? workspace.facts.map((fact) => <article key={fact.id}><div><strong>{fact.text}</strong><span>{fact.source}</span></div>{canManage ? <button type="button" onClick={() => mutate({ action: "fact.delete", id: fact.id }).then(() => setNotice("Fact archived."))}>Archive</button> : null}</article>) : <p className="workspace-empty">No family facts yet.</p>}</div>
    </div> : null}

    {tab === "medications" ? <div className="workspace-grid workspace-grid--split">
      {canManage ? <form className="workspace-form" onSubmit={(event) => submitAction(event, "medication.create", (values) => ({ ...values, days: [0, 1, 2, 3, 4, 5, 6], escalationMinutes: 30 }))}><h3>Add a medication reminder</h3><label>Label<input name="label" required maxLength={100} placeholder="Morning medication" /></label><label>Time<input name="time" type="time" required /></label><label>Reminder note<textarea name="note" maxLength={240} rows={3} placeholder="Optional private caregiver note" /></label><input name="timezone" type="hidden" value={Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"} /><button className="button button--dark" disabled={isPending} type="submit">Add daily schedule</button><small>Always verify the schedule against the medication label or care professional’s instructions.</small></form> : null}
      <div className="workspace-list"><h3>Medication schedules</h3>{workspace.medications.length ? workspace.medications.map((item) => <article key={item.id}><div><strong>{item.label} · {item.timeLocal}</strong><span>{item.enabled ? `Daily · ${item.timezone}` : "Paused"}</span></div>{canManage ? <div className="workspace-actions"><button type="button" onClick={() => mutate({ action: "medication.toggle", id: item.id, enabled: !item.enabled })}>{item.enabled ? "Pause" : "Resume"}</button><button type="button" onClick={() => mutate({ action: "medication.delete", id: item.id })}>Remove</button></div> : null}</article>) : <p className="workspace-empty">No medication reminders yet.</p>}</div>
    </div> : null}

    {tab === "care" ? <div className="workspace-grid workspace-grid--split">
      {canManage ? <form className="workspace-form" onSubmit={(event) => submitAction(event, "plan.create")}><h3>Add a care-plan item</h3><label>Goal or action<input name="title" required maxLength={120} placeholder="Plan two social visits each week" /></label><label>Details<textarea name="details" maxLength={800} rows={4} /></label><div className="workspace-form-row"><label>Category<select name="category"><option value="connection">Connection</option><option value="routine">Routine</option><option value="mobility">Mobility</option><option value="healthcare">Healthcare</option><option value="home">Home support</option></select></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option></select></label></div><label>Target date<input name="targetDate" type="date" /></label><button className="button button--dark" disabled={isPending} type="submit">Add to plan</button></form> : null}
      <div className="workspace-list"><h3>Shared care plan</h3>{workspace.plans.length ? workspace.plans.map((item) => <article key={item.id}><div><span>{item.category} · {item.priority} priority</span><strong>{item.title}</strong><p>{item.details}</p></div>{canManage ? <select aria-label={`Status for ${item.title}`} value={item.status} onChange={(event) => mutate({ action: "plan.status", id: item.id, status: event.target.value })}><option value="proposed">Proposed</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="declined">Declined</option></select> : <span>{item.status}</span>}</article>) : <p className="workspace-empty">No care-plan items yet.</p>}</div>
    </div> : null}

    {tab === "displays" ? <div className="workspace-grid workspace-grid--split">
      <div className="workspace-form"><h3>Pair a TV or browser</h3><ol><li>Open <strong>{typeof window === "undefined" ? "/display" : `${window.location.origin}/display`}</strong> on the TV.</li><li>Enter its six-digit code here.</li><li>Soni’s live face, captions, reminders, and selected photos will appear.</li></ol>{canManage ? <><label>TV pairing code<input value={pairingCode} onChange={(event) => setPairingCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="000000" /></label><button className="button button--dark" type="button" disabled={pairingCode.length !== 6} onClick={pairDisplay}>Connect display</button></> : null}</div>
      <div className="workspace-list"><h3>Paired displays</h3>{workspace.displays.length ? workspace.displays.map((display) => <article key={display.id}><div><strong>{display.name}</strong><span>{display.online ? "Online now" : display.lastSeenAt ? `Last seen ${new Date(display.lastSeenAt).toLocaleString()}` : "Waiting for first connection"}</span></div>{canManage && display.status === "active" ? <button type="button" onClick={async () => { await fetch(`/api/profile/${profileId}/displays/revoke`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayId: display.id }) }); setWorkspace((current) => ({ ...current, displays: current.displays.filter((item) => item.id !== display.id) })); }}>Disconnect</button> : null}</article>) : <p className="workspace-empty">No TV or browser display is paired yet.</p>}</div>
    </div> : null}

    {tab === "insights" ? <div className="workspace-stack">
      <div className="workspace-grid workspace-grid--metrics"><article><span className="workspace-metric">{workspace.trends.reduce((total, item) => total + item.conversations, 0)}</span><strong>conversations in view</strong><Sparkline values={workspace.trends.map((item) => item.conversations)} /></article><article><span className="workspace-metric">{workspace.trends.at(-1)?.wordsPerTurn?.toFixed(0) ?? "—"}</span><strong>recent words per turn</strong><Sparkline values={workspace.trends.flatMap((item) => item.wordsPerTurn === null ? [] : [item.wordsPerTurn])} /></article><article><span className="workspace-metric">{workspace.trends.at(-1)?.activities ?? "—"}</span><strong>recent activities</strong><Sparkline values={workspace.trends.map((item) => item.activities)} /></article></div>
      <div className="workspace-report"><div><p className="eyebrow">Longitudinal care report</p><h3>{workspace.trends.length ? `${workspace.trends.length} days of derived indicators` : "Waiting for Soni’s first daily summary"}</h3><a className="button button--light" href={`/portal/profile/${profileId}/report`}>Open printable report</a></div><p>These patterns can support family planning, but they do not diagnose cognitive decline or replace clinical assessment. Raw audio and transcripts are not uploaded for this dashboard.</p></div>
    </div> : null}

    {tab === "setup" ? <div className="workspace-onboarding">
      <div><span className="workspace-step is-complete">1</span><h3>Profile ready</h3><p>{preferredName}’s household workspace is active.</p></div>
      <div><span className={`workspace-step ${piDevices.length ? "is-complete" : ""}`}>2</span><h3>Connect Soni</h3><p>{piDevices.length ? `${piDevices[0].name} is registered${connected ? " and online" : " but currently offline"}.` : "On Soni, open Connect to website and enter its code in the connection panel below."}</p></div>
      <div><span className={`workspace-step ${workspace.displays.length ? "is-complete" : ""}`}>3</span><h3>Add a household screen</h3><p>Open the display page on a Smart TV browser, tablet, laptop, or streaming device with a browser.</p><button type="button" className="portal-outline-button" onClick={showSetupQr}>Show setup QR</button>{qrCode ? <Image src={qrCode} width={260} height={260} alt="QR code for Soni display setup" unoptimized /> : null}</div>
      <div><span className={`workspace-step ${connected && displayOnline ? "is-complete" : ""}`}>4</span><h3>Diagnostics</h3><ul><li>Pi cloud sync: <strong>{connected ? "passing" : "waiting"}</strong></li><li>Remote display: <strong>{displayOnline ? "passing" : "waiting"}</strong></li><li>Private media boundary: <strong>enforced</strong></li><li>Raw audio upload: <strong>disabled</strong></li></ul></div>
    </div> : null}
  </section>;
}
