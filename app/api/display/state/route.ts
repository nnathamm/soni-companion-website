import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { authenticateDisplay } from "@/lib/display-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const display = await authenticateDisplay(request);
    const sql = db();
    const rows = await sql<{
      revision: number; mode: string; face_state: string; title: string; caption: string;
      user_text: string; assistant_text: string; media_id: string | null; blob_pathname: string | null;
      content_type: string | null; expires_at: string | null; updated_at: string;
    }[]>`
      SELECT s.revision, s.mode, s.face_state, s.title, s.caption, s.user_text, s.assistant_text,
        s.media_id, m.blob_pathname, m.content_type, s.expires_at::text, s.updated_at::text
      FROM remote_display_state s LEFT JOIN family_media m ON m.id=s.media_id AND m.status='active'
      WHERE s.profile_id=${display.profileId} LIMIT 1
    `;
    await sql`UPDATE remote_displays SET last_seen_at=now(), updated_at=now() WHERE id=${display.id} AND (last_seen_at IS NULL OR last_seen_at < now() - interval '20 seconds')`;
    const state = rows[0];
    let mediaUrl: string | null = null;
    if (state?.blob_pathname) {
      const validUntil = Date.now() + 2 * 60 * 1000;
      const signed = await issueSignedToken({ pathname: state.blob_pathname, operations: ["get"], validUntil });
      mediaUrl = (await presignUrl(signed, { access: "private", operation: "get", pathname: state.blob_pathname, validUntil })).presignedUrl;
    }
    const expired = Boolean(state?.expires_at && new Date(state.expires_at).valueOf() < Date.now());
    if (expired) {
      await sql`
        UPDATE remote_display_state SET mode='face', face_state='idle', title='', caption='',
          user_text='', assistant_text='', media_id=NULL, notification_id=NULL, expires_at=NULL, updated_at=now()
        WHERE profile_id=${display.profileId}
      `;
    }
    return Response.json({ ok: true, profileId: display.profileId, state: !state || expired ? {
      revision: state?.revision ?? 0, mode: "face", faceState: "idle", title: "", caption: "", userText: "", assistantText: "", mediaId: null, mediaUrl: null,
    } : {
      revision: Number(state.revision), mode: state.mode, faceState: state.face_state, title: state.title,
      caption: state.caption, userText: state.user_text, assistantText: state.assistant_text,
      mediaId: state.media_id, mediaUrl, contentType: state.content_type, updatedAt: state.updated_at,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
