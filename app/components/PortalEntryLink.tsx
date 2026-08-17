"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { AUTH_STATE_COOKIE_NAME } from "@/lib/auth-state";

type PortalEntryLinkProps = {
  className?: string;
  onClick?: () => void;
};

const AUTH_STATE_EVENT = "soni-auth-state";

function readSignedInCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((entry) => entry === `${AUTH_STATE_COOKIE_NAME}=1`);
}

function authStateKnown() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith(`${AUTH_STATE_COOKIE_NAME}=`));
}

function subscribe(listener: () => void) {
  window.addEventListener(AUTH_STATE_EVENT, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("pageshow", listener);
  return () => {
    window.removeEventListener(AUTH_STATE_EVENT, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("pageshow", listener);
  };
}

export default function PortalEntryLink({ className, onClick }: PortalEntryLinkProps) {
  const signedIn = useSyncExternalStore(subscribe, readSignedInCookie, () => false);

  useEffect(() => {
    if (authStateKnown() && !readSignedInCookie()) return;
    const controller = new AbortController();
    fetch("/api/auth/status", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) window.dispatchEvent(new Event(AUTH_STATE_EVENT));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <Link className={className} href={signedIn ? "/portal" : "/portal/login"} onClick={onClick}>
      {signedIn ? "Profile" : "Login"}
    </Link>
  );
}
