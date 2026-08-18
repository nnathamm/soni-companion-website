import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/portal-store";
import { canManageProfile, requireProfileAccess } from "@/lib/profile-access";
import { assertSameOrigin, isUuid } from "@/lib/security";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const access = await requireProfileAccess(id);
    if (!canManageProfile(access)) throw new Error("permission_denied");
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as Record<string, unknown>;
    const displayId = String(body.displayId ?? "");
    if (!isUuid(displayId)) throw new Error("invalid_input");
    const rows = await db()<{ id: string }[]>`
      UPDATE remote_displays SET status='revoked', revoked_at=now(), updated_at=now()
      WHERE id=${displayId} AND profile_id=${id} AND status='active' RETURNING id
    `;
    if (!rows[0]) throw new Error("not_found");
    await writeAudit(access.user.id, "display.revoked", id, { displayId });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
