import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/portal-store";
import { canManageProfile, requireProfileAccess } from "@/lib/profile-access";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const access = await requireProfileAccess(id);
    if (!canManageProfile(access)) throw new Error("permission_denied");
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as Record<string, unknown>;
    const code = String(body.pairingCode ?? "").replace(/\D/g, "").slice(0, 6);
    if (!/^[0-9]{6}$/.test(code)) throw new Error("invalid_input");
    const paired = await db().begin(async (sql) => {
      const requests = await sql<{ id: string; display_id: string; token_hash: string; display_name: string }[]>`
        SELECT id, display_id, token_hash, display_name FROM remote_display_pairing_requests
        WHERE pairing_code=${code} AND expires_at > now() AND approved_at IS NULL FOR UPDATE
      `;
      const item = requests[0];
      if (!item) throw new Error("pairing_expired");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO remote_displays (profile_id, display_id, token_hash, display_name, paired_by)
        VALUES (${id}, ${item.display_id}, ${item.token_hash}, ${item.display_name}, ${access.user.id})
        ON CONFLICT (display_id) DO UPDATE SET profile_id=EXCLUDED.profile_id, token_hash=EXCLUDED.token_hash,
          display_name=EXCLUDED.display_name, status='active', paired_by=EXCLUDED.paired_by,
          paired_at=now(), last_seen_at=NULL, revoked_at=NULL, updated_at=now()
        RETURNING id
      `;
      await sql`UPDATE remote_display_pairing_requests SET approved_profile_id=${id}, approved_by=${access.user.id}, approved_at=now() WHERE id=${item.id}`;
      return { id: rows[0].id, name: item.display_name };
    });
    await writeAudit(access.user.id, "display.paired", id, { displayId: paired.id, displayName: paired.name });
    return Response.json({ ok: true, workspace: await import("@/lib/household-content").then(({ householdWorkspace }) => householdWorkspace(id)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
