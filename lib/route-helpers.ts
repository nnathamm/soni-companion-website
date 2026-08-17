import { NextResponse } from "next/server";

export function redirectWith(requestUrl: string, path: string, key: "error" | "notice", value: string) {
  const target = new URL(path, requestUrl);
  target.searchParams.set(key, value);
  return NextResponse.redirect(target, 303);
}

export function portalError(requestUrl: string, path: string, error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed";
  const publicCode = [
    "invalid_origin", "invalid_input", "invalid_setup_code", "invalid_password", "invalid_credentials", "rate_limited",
    "setup_unavailable", "admin_required", "not_found", "portal_not_configured",
  ].includes(code) ? code : "request_failed";
  return redirectWith(requestUrl, path, "error", publicCode);
}
