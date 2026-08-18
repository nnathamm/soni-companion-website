export function apiError(error: unknown) {
  const code = error instanceof Error ? error.message : "request_failed";
  const statuses: Record<string, number> = {
    authentication_required: 401,
    invalid_input: 400,
    invalid_json: 400,
    invalid_origin: 403,
    not_found: 404,
    permission_denied: 403,
    pairing_expired: 404,
    pairing_rate_limited: 429,
    display_unauthorized: 401,
    portal_not_configured: 503,
    storage_unavailable: 503,
  };
  const publicCode = code in statuses ? code : "request_failed";
  return Response.json(
    { ok: false, error: publicCode },
    { status: statuses[publicCode] ?? 500, headers: { "Cache-Control": "no-store" } },
  );
}
