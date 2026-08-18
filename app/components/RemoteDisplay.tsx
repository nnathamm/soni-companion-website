"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Credentials = { version: 1; displayId: string; token: string; requestId?: string; pairingCode?: string; profileName?: string };
type DisplayState = {
  revision: number; mode: string; faceState: string; title: string; caption: string;
  userText: string; assistantText: string; mediaId: string | null; mediaUrl: string | null;
};

const STORAGE_KEY = "soni.remote-display.v1";

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function makeCredentials(): Credentials {
  const idBytes = crypto.getRandomValues(new Uint8Array(16));
  const secretBytes = crypto.getRandomValues(new Uint8Array(32));
  const displayId = [...idBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return { version: 1, displayId, token: `${displayId}.${base64Url(secretBytes)}` };
}

function storedCredentials() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Credentials | null;
    return stored?.version === 1 && stored.token?.startsWith(`${stored.displayId}.`) ? stored : null;
  } catch {
    return null;
  }
}

export default function RemoteDisplay() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [profileName, setProfileName] = useState("");
  const [state, setState] = useState<DisplayState | null>(null);
  const [fault, setFault] = useState("");
  const initialized = useRef(false);

  const saveCredentials = useCallback((next: Credentials) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCredentials(next);
  }, []);

  const requestPairing = useCallback(async (current: Credentials) => {
    const response = await fetch("/api/display/pair/request", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${current.token}` },
      body: JSON.stringify({ deviceId: current.displayId, deviceName: "Household display", softwareVersion: "web-1" }),
    });
    const payload = await response.json() as { requestId?: string; pairingCode?: string; error?: string };
    if (!response.ok || !payload.requestId || !payload.pairingCode) throw new Error(payload.error ?? "pairing_failed");
    saveCredentials({ ...current, requestId: payload.requestId, pairingCode: payload.pairingCode });
    setPairingCode(payload.pairingCode);
  }, [saveCredentials]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const current = storedCredentials() ?? makeCredentials();
    saveCredentials(current);
    if (current.pairingCode) {
      queueMicrotask(() => setPairingCode(current.pairingCode ?? ""));
    }
    if (current.profileName) {
      queueMicrotask(() => setProfileName(current.profileName ?? "Soni"));
    }
    if (!current.requestId) {
      void Promise.resolve().then(() => requestPairing(current)).catch((error) => setFault(String(error)));
    }
  }, [requestPairing, saveCredentials]);

  useEffect(() => {
    if (!credentials?.requestId || profileName) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/display/pair/status?requestId=${encodeURIComponent(credentials.requestId ?? "")}`, { headers: { Authorization: `Bearer ${credentials.token}` }, cache: "no-store" });
        const payload = await response.json() as { state?: string; pairingCode?: string; profile?: { preferredName?: string | null; label?: string }; error?: string };
        if (response.ok && payload.state === "approved" && payload.profile) {
          const name = payload.profile.preferredName || payload.profile.label || "Soni";
          setProfileName(name);
          saveCredentials({ ...credentials, profileName: name, pairingCode: undefined });
          setPairingCode("");
          setFault("");
        } else if (!response.ok && payload.error === "pairing_expired") {
          await requestPairing({ ...credentials, requestId: undefined });
        }
      } catch {
        setFault("Connection interrupted. Retrying…");
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [credentials, profileName, requestPairing, saveCredentials]);

  useEffect(() => {
    if (!credentials || !profileName) return;
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/display/state", { headers: { Authorization: `Bearer ${credentials?.token ?? ""}` }, cache: "no-store" });
        const payload = await response.json() as { state?: DisplayState; error?: string };
        if (!response.ok || !payload.state) throw new Error(payload.error ?? "display_unavailable");
        if (active) { setState(payload.state); setFault(""); }
      } catch {
        if (active) setFault("Soni is temporarily unreachable. Reconnecting…");
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => { active = false; window.clearInterval(timer); };
  }, [credentials, profileName]);

  if (!profileName) return <main className="remote-display remote-display--pairing"><div className="remote-pair-card"><p className="eyebrow">Soni household display</p><h1>Connect this screen</h1><p>On a signed-in family profile, open <strong>TV & devices</strong> and enter this code.</p><div className="remote-pair-code" aria-label={`Pairing code ${pairingCode || "loading"}`}>{pairingCode || "······"}</div><p className="remote-display-status">{fault || "Waiting securely for approval…"}</p></div></main>;

  const faceState = state?.faceState ?? "idle";
  return <main className={`remote-display is-${faceState}`}>
    {state?.mediaUrl ? <div className="remote-display-media" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,24,31,.92), rgba(8,24,31,.22)), url("${state.mediaUrl}")` }} /> : null}
    <div className="remote-display-content">
      <header><span className="remote-live-dot" /> <strong>Soni</strong><span>{fault || (faceState === "listening" ? "Listening" : faceState === "thinking" ? "Thinking" : faceState === "speaking" ? "Speaking" : "Here with you")}</span></header>
      <div className="remote-face" aria-label={`Soni is ${faceState}`}><span className="remote-eye" /><span className="remote-eye" /><span className="remote-mouth" /></div>
      {state?.title || state?.caption || state?.assistantText ? <section className="remote-caption"><p className="eyebrow">{state?.mode === "memory" ? "A family memory" : state?.mode === "reminder" ? "A gentle reminder" : "Conversation"}</p>{state.title ? <h1>{state.title}</h1> : null}<p>{state.caption || state.assistantText}</p></section> : <section className="remote-caption"><h1>Hello, {profileName}.</h1><p>I’m right here whenever you’d like to talk.</p></section>}
    </div>
  </main>;
}
