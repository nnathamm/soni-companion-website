import { NextRequest } from "next/server";
import { authenticateDevice } from "@/lib/device-auth";
import { deviceError } from "@/lib/device-response";
import { db } from "@/lib/db";
import { cleanText, isUuid } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const device = await authenticateDevice(request);
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as Record<string, unknown>;
    const mode = ["face", "conversation", "memory", "message", "reminder", "welcome"].includes(String(body.mode)) ? String(body.mode) : "conversation";
    const faceState = ["idle", "listening", "thinking", "speaking", "sleeping", "error"].includes(String(body.faceState)) ? String(body.faceState) : "idle";
    const mediaId = isUuid(String(body.mediaId ?? "")) ? String(body.mediaId) : null;
    if (mediaId) {
      const media = await db()<{ id: string }[]>`SELECT id FROM family_media WHERE id=${mediaId} AND profile_id=${device.profileId} AND status='active'`;
      if (!media[0]) throw new Error("invalid_input");
    }
    await db()`
      INSERT INTO remote_display_state (profile_id, mode, face_state, title, caption, user_text, assistant_text, media_id, expires_at)
      VALUES (${device.profileId}, ${mode}, ${faceState}, ${cleanText(String(body.title ?? ""), 100)},
        ${cleanText(String(body.caption ?? ""), 500)}, '',
        ${cleanText(String(body.assistantText ?? ""), 1000)}, ${mediaId}, now() + interval '10 minutes')
      ON CONFLICT (profile_id) DO UPDATE SET revision=remote_display_state.revision+1,
        mode=EXCLUDED.mode, face_state=EXCLUDED.face_state, title=EXCLUDED.title, caption=EXCLUDED.caption,
        user_text=EXCLUDED.user_text, assistant_text=EXCLUDED.assistant_text, media_id=EXCLUDED.media_id,
        notification_id=NULL, expires_at=EXCLUDED.expires_at, updated_at=now()
    `;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
