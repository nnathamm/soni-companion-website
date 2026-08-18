import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del, head } from "@vercel/blob";
import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requireProfileAccess, canManageProfile } from "@/lib/profile-access";
import { assertSameOrigin, cleanText } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAXIMUM_SIZE = 12 * 1024 * 1024;

type UploadMetadata = {
  profileId: string;
  userId: string;
  title: string;
  caption: string;
  storyDate: string | null;
  tags: string[];
  size: number;
};

function uploadMetadata(value: string | null): Omit<UploadMetadata, "profileId" | "userId"> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(value ?? "") as Record<string, unknown>;
  } catch {
    throw new Error("invalid_input");
  }
  const size = Number(parsed.size);
  const title = cleanText(String(parsed.title ?? ""), 100);
  const caption = cleanText(String(parsed.caption ?? ""), 500);
  const storyDateRaw = String(parsed.storyDate ?? "");
  const storyDate = /^\d{4}-\d{2}-\d{2}$/.test(storyDateRaw) ? storyDateRaw : null;
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((item) => cleanText(String(item), 30)).filter(Boolean).slice(0, 12)
    : [];
  if (!title || !Number.isInteger(size) || size < 1 || size > MAXIMUM_SIZE) throw new Error("invalid_input");
  return { title, caption, storyDate, tags, size };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as HandleUploadBody;
    if (body.type === "blob.generate-client-token") assertSameOrigin(request);
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const access = await requireProfileAccess(id);
        if (!canManageProfile(access)) throw new Error("permission_denied");
        const metadata = uploadMetadata(clientPayload);
        const safeFilename = pathname.split("/").pop()?.replace(/[^A-Za-z0-9._-]/g, "-").slice(-100) || "family-photo";
        if (pathname !== `households/${id}/${safeFilename}`) throw new Error("invalid_input");
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAXIMUM_SIZE,
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 3600,
          tokenPayload: JSON.stringify({ ...metadata, profileId: id, userId: access.user.id } satisfies UploadMetadata),
          callbackUrl: new URL(`/api/profile/${id}/media/upload`, request.url).toString(),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const metadata = JSON.parse(tokenPayload ?? "") as UploadMetadata;
        if (metadata.profileId !== id || !ALLOWED_TYPES.includes(blob.contentType) || !blob.pathname.startsWith(`households/${id}/`)) {
          throw new Error("invalid_input");
        }
        const stored = await head(blob.pathname);
        if (!ALLOWED_TYPES.includes(stored.contentType) || stored.size < 1 || stored.size > MAXIMUM_SIZE) {
          await del(blob.pathname);
          throw new Error("invalid_input");
        }
        await db()`
          INSERT INTO family_media (
            profile_id, blob_url, blob_pathname, content_type, size_bytes, title, caption,
            story_date, tags, uploaded_by
          ) VALUES (
            ${id}, ${blob.url}, ${blob.pathname}, ${stored.contentType}, ${stored.size}, ${metadata.title},
            ${metadata.caption}, ${metadata.storyDate}, ${metadata.tags}, ${metadata.userId}
          ) ON CONFLICT (blob_pathname) DO NOTHING
        `;
      },
    });
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
