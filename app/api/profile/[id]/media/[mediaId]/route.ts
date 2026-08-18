import { del, issueSignedToken, presignUrl } from "@vercel/blob";
import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireProfileAccess, canManageProfile } from "@/lib/profile-access";
import { assertSameOrigin, isUuid } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function mediaRecord(profileId: string, mediaId: string) {
  if (!isUuid(mediaId)) throw new Error("invalid_input");
  const rows = await db()<{
    id: string; blob_pathname: string; content_type: string; status: string;
  }[]>`
    SELECT id, blob_pathname, content_type, status FROM family_media
    WHERE id=${mediaId} AND profile_id=${profileId} LIMIT 1
  `;
  if (!rows[0] || rows[0].status !== "active") throw new Error("not_found");
  return rows[0];
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  try {
    const { id, mediaId } = await params;
    await requireProfileAccess(id);
    const media = await mediaRecord(id, mediaId);
    const validUntil = Date.now() + 2 * 60 * 1000;
    const signed = await issueSignedToken({ pathname: media.blob_pathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(signed, {
      access: "private", operation: "get", pathname: media.blob_pathname, validUntil,
    });
    return Response.redirect(presignedUrl, 307);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  try {
    assertSameOrigin(request);
    const { id, mediaId } = await params;
    const access = await requireProfileAccess(id);
    if (!canManageProfile(access)) throw new Error("permission_denied");
    const media = await mediaRecord(id, mediaId);
    await del(media.blob_pathname);
    await db()`DELETE FROM family_media WHERE id=${mediaId} AND profile_id=${id}`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
