export function deviceError(error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed";
  const statuses: Record<string, number> = {
    invalid_input: 400,
    invalid_json: 400,
    device_unauthorized: 401,
    pairing_expired: 404,
    pairing_rate_limited: 429,
    portal_not_configured: 503,
  };
  const publicCode = code in statuses ? code : "request_failed";
  return Response.json({ ok: false, error: publicCode }, { status: statuses[publicCode] ?? 500 });
}
