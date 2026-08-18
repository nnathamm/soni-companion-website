import { authenticateDevice } from "@/lib/device-auth";
import { db } from "@/lib/db";
import { deviceError } from "@/lib/device-response";
import { cloudContentForProfile } from "@/lib/household-content";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const device = await authenticateDevice(request);
    const sql = db();
    const [profiles, permissions, content] = await Promise.all([
      sql<{
        id: string;
        profile_label: string;
        preferred_name: string | null;
        status: string;
        privacy_mode: string;
        config_version: string;
      }[]>`
        SELECT p.id, p.profile_label, p.preferred_name, p.status, p.privacy_mode,
          GREATEST(p.updated_at, COALESCE(MAX(f.updated_at), p.updated_at))::text AS config_version
        FROM senior_profiles p
        LEFT JOIN feature_permissions f ON f.profile_id = p.id
        WHERE p.id = ${device.profileId}
        GROUP BY p.id
      `,
      sql<{ feature_key: string; enabled: boolean }[]>`
        SELECT feature_key, enabled FROM feature_permissions WHERE profile_id = ${device.profileId}
      `,
      cloudContentForProfile(device.profileId),
    ]);
    const profile = profiles[0];
    if (!profile) throw new Error("device_unauthorized");
    await sql`
      UPDATE remote_display_state SET mode='face', face_state='idle', title='', caption='',
        user_text='', assistant_text='', media_id=NULL, notification_id=NULL, expires_at=NULL, updated_at=now()
      WHERE profile_id=${device.profileId} AND expires_at IS NOT NULL AND expires_at <= now()
    `;
    await sql`
      UPDATE household_devices SET
        last_seen_at = now(), last_sync_at = now(), updated_at = now()
      WHERE id = ${device.id}
        AND (last_seen_at IS NULL OR last_seen_at < now() - interval '45 seconds')
    `;
    return Response.json({
      ok: true,
      configVersion: content.version || profile.config_version,
      profile: {
        id: profile.id,
        label: profile.profile_label,
        preferredName: profile.preferred_name,
        status: profile.status,
        privacyMode: profile.privacy_mode,
        localProfileCode: `WEB-${profile.id.replaceAll("-", "").slice(0, 12).toUpperCase()}`,
      },
      features: Object.fromEntries(permissions.map((item) => [item.feature_key, item.enabled])),
      content,
      sync: {
        protocolVersion: 2,
        rawAudio: false,
        transcripts: false,
        localPrivacySleepOverridesCloud: true,
        mediaPolicy: {
          version: 1,
          delivery: "paired_display_direct",
          metadataOnly: true,
          piReceivesFiles: false,
          piReceivesUrls: false,
          piCachesMedia: false,
          piStoresMedia: false,
        },
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
