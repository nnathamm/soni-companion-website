import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { householdWorkspace } from "@/lib/household-content";
import { writeAudit } from "@/lib/portal-store";
import { requireProfileAccess, canManageProfile } from "@/lib/profile-access";
import { assertSameOrigin, cleanText, isUuid } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bodyObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_input");
  return value as Record<string, unknown>;
}

function dateValue(value: unknown, includeTime = false) {
  const text = String(value ?? "");
  const pattern = includeTime ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ : /^\d{4}-\d{2}-\d{2}$/;
  return pattern.test(text) && !Number.isNaN(new Date(includeTime ? text : `${text}T00:00:00`).valueOf()) ? text : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireProfileAccess(id);
    return Response.json({ ok: true, workspace: await householdWorkspace(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const access = await requireProfileAccess(id);
    if (!canManageProfile(access)) throw new Error("permission_denied");
    const body = bodyObject(await request.json().catch(() => { throw new Error("invalid_json"); }));
    const action = String(body.action ?? "");
    const sql = db();
    let recordId = "";

    if (action === "fact.create") {
      const text = cleanText(String(body.text ?? ""), 500);
      const source = cleanText(String(body.source ?? "Family"), 80) || "Family";
      if (!text) throw new Error("invalid_input");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO family_facts_cloud (profile_id, fact_text, source_label, contributed_by)
        VALUES (${id}, ${text}, ${source}, ${access.user.id}) RETURNING id
      `;
      recordId = rows[0].id;
    } else if (action === "fact.delete") {
      recordId = String(body.id ?? "");
      if (!isUuid(recordId)) throw new Error("invalid_input");
      await sql`UPDATE family_facts_cloud SET status='archived', updated_at=now() WHERE id=${recordId} AND profile_id=${id}`;
    } else if (action === "medication.create") {
      const label = cleanText(String(body.label ?? "Medication"), 100) || "Medication";
      const time = String(body.time ?? "");
      const timezone = cleanText(String(body.timezone ?? "America/Chicago"), 80) || "America/Chicago";
      const note = cleanText(String(body.note ?? ""), 240);
      const escalation = Math.max(5, Math.min(240, Number(body.escalationMinutes ?? 30) || 30));
      const days = Array.isArray(body.days) ? [...new Set(body.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))] : [];
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !days.length) throw new Error("invalid_input");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO medication_schedules_cloud (profile_id, label, time_local, days, timezone, reminder_note, escalation_minutes, verified_by)
        VALUES (${id}, ${label}, ${time}, ${days}, ${timezone}, ${note}, ${escalation}, ${access.user.id}) RETURNING id
      `;
      recordId = rows[0].id;
    } else if (action === "medication.toggle") {
      recordId = String(body.id ?? "");
      if (!isUuid(recordId) || typeof body.enabled !== "boolean") throw new Error("invalid_input");
      await sql`UPDATE medication_schedules_cloud SET enabled=${body.enabled}, updated_at=now() WHERE id=${recordId} AND profile_id=${id}`;
    } else if (action === "medication.delete") {
      recordId = String(body.id ?? "");
      if (!isUuid(recordId)) throw new Error("invalid_input");
      await sql`DELETE FROM medication_schedules_cloud WHERE id=${recordId} AND profile_id=${id}`;
    } else if (action === "plan.create") {
      const title = cleanText(String(body.title ?? ""), 120);
      const details = cleanText(String(body.details ?? ""), 800);
      const category = cleanText(String(body.category ?? "connection"), 40) || "connection";
      const priority = ["low", "normal", "high"].includes(String(body.priority)) ? String(body.priority) : "normal";
      const targetDate = dateValue(body.targetDate);
      if (!title) throw new Error("invalid_input");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO support_plan_items (profile_id, title, details, category, priority, target_date, proposed_by)
        VALUES (${id}, ${title}, ${details}, ${category}, ${priority}, ${targetDate}, ${access.user.id}) RETURNING id
      `;
      recordId = rows[0].id;
    } else if (action === "plan.status") {
      recordId = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!isUuid(recordId) || !["proposed", "approved", "completed", "declined"].includes(status)) throw new Error("invalid_input");
      await sql`UPDATE support_plan_items SET status=${status}, updated_at=now() WHERE id=${recordId} AND profile_id=${id}`;
    } else if (action === "notification.create") {
      const kind = ["reminder", "family_update", "appointment", "check_in"].includes(String(body.kind)) ? String(body.kind) : "reminder";
      const title = cleanText(String(body.title ?? ""), 100);
      const message = cleanText(String(body.message ?? ""), 400);
      const scheduledFor = dateValue(body.scheduledFor, true);
      if (!title || !scheduledFor) throw new Error("invalid_input");
      const rows = await sql<{ id: string }[]>`
        INSERT INTO remote_notifications (profile_id, kind, title, message, scheduled_for, created_by)
        VALUES (${id}, ${kind}, ${title}, ${message}, ${new Date(scheduledFor)}, ${access.user.id}) RETURNING id
      `;
      recordId = rows[0].id;
    } else if (action === "notification.cancel") {
      recordId = String(body.id ?? "");
      if (!isUuid(recordId)) throw new Error("invalid_input");
      await sql`UPDATE remote_notifications SET status='cancelled', updated_at=now() WHERE id=${recordId} AND profile_id=${id}`;
    } else if (action === "display.command") {
      const mode = ["face", "conversation", "memory", "message", "reminder", "welcome"].includes(String(body.mode)) ? String(body.mode) : "message";
      const mediaId = isUuid(String(body.mediaId ?? "")) ? String(body.mediaId) : null;
      const title = cleanText(String(body.title ?? ""), 100);
      const caption = cleanText(String(body.caption ?? ""), 500);
      if (mediaId) {
        const media = await sql<{ id: string }[]>`SELECT id FROM family_media WHERE id=${mediaId} AND profile_id=${id} AND status='active'`;
        if (!media[0]) throw new Error("not_found");
      }
      await sql`
        INSERT INTO remote_display_state (profile_id, mode, face_state, title, caption, media_id, expires_at)
        VALUES (${id}, ${mode}, 'idle', ${title}, ${caption}, ${mediaId}, now() + interval '15 minutes')
        ON CONFLICT (profile_id) DO UPDATE SET revision=remote_display_state.revision+1,
          mode=EXCLUDED.mode, face_state=EXCLUDED.face_state, title=EXCLUDED.title,
          caption=EXCLUDED.caption, user_text='', assistant_text='', media_id=EXCLUDED.media_id,
          notification_id=NULL, expires_at=EXCLUDED.expires_at, updated_at=now()
      `;
    } else {
      throw new Error("invalid_input");
    }

    await writeAudit(access.user.id, action, id, recordId ? { recordId } : {});
    return Response.json({ ok: true, workspace: await householdWorkspace(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
