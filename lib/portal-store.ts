import { db } from "./db";
import { companionFeatures } from "./features";

type AuditJsonValue = null | string | number | boolean | AuditJsonValue[] | { [key: string]: AuditJsonValue | undefined };

export type PortalProfile = {
  id: string;
  profileLabel: string;
  preferredName: string | null;
  status: "active" | "paused" | "archived";
  privacyMode: "strict" | "standard";
  relationship?: string;
};

export async function profilesForUser(userId: string, admin: boolean) {
  const sql = db();
  const rows = admin
    ? await sql<Record<string, string | null>[]>`
        SELECT id, profile_label, preferred_name, status, privacy_mode, 'administrator' AS relationship
        FROM senior_profiles ORDER BY created_at DESC
      `
    : await sql<Record<string, string | null>[]>`
        SELECT p.id, p.profile_label, p.preferred_name, p.status, p.privacy_mode, m.relationship
        FROM senior_profiles p
        JOIN profile_memberships m ON m.profile_id = p.id
        WHERE m.user_id = ${userId}
        ORDER BY p.created_at DESC
      `;
  return rows.map((row) => ({
    id: String(row.id),
    profileLabel: String(row.profile_label),
    preferredName: row.preferred_name ? String(row.preferred_name) : null,
    status: row.status as PortalProfile["status"],
    privacyMode: row.privacy_mode as PortalProfile["privacyMode"],
    relationship: row.relationship ? String(row.relationship) : undefined,
  }));
}

export async function profileForUser(profileId: string, userId: string, admin: boolean) {
  const rows = admin
    ? await db()<Record<string, string | null>[]>`
        SELECT id, profile_label, preferred_name, status, privacy_mode
        FROM senior_profiles WHERE id = ${profileId} LIMIT 1
      `
    : await db()<Record<string, string | null>[]>`
        SELECT p.id, p.profile_label, p.preferred_name, p.status, p.privacy_mode, m.relationship
        FROM senior_profiles p JOIN profile_memberships m ON m.profile_id = p.id
        WHERE p.id = ${profileId} AND m.user_id = ${userId} LIMIT 1
      `;
  const row = rows[0];
  if (!row) return null;
  const [permissions, devices] = await Promise.all([
    db()<Record<string, string | boolean | null>[]>`
      SELECT feature_key, enabled, approved_at::text FROM feature_permissions WHERE profile_id = ${profileId}
    `,
    db()<Record<string, string | boolean | null>[]>`
      SELECT d.id, d.device_name, d.software_version, d.status, d.paired_at::text, d.last_seen_at::text, d.last_sync_at::text,
        x.status AS diagnostic_status, x.checks::text AS diagnostic_checks,
        x.uptime_seconds, x.reported_at::text AS diagnostics_reported_at,
        (d.status = 'active' AND d.last_seen_at > now() - interval '90 seconds') AS online
      FROM household_devices d LEFT JOIN device_diagnostics x ON x.device_id=d.id
      WHERE d.profile_id = ${profileId}
      ORDER BY d.status = 'active' DESC, d.paired_at DESC
    `,
  ]);
  const permissionMap = new Map(permissions.map((item) => [String(item.feature_key), Boolean(item.enabled)]));
  return {
    id: String(row.id),
    profileLabel: String(row.profile_label),
    preferredName: row.preferred_name ? String(row.preferred_name) : null,
    status: String(row.status),
    privacyMode: String(row.privacy_mode),
    relationship: row.relationship ? String(row.relationship) : admin ? "administrator" : "member",
    features: companionFeatures.map((feature) => ({ ...feature, enabled: permissionMap.get(feature.key) ?? false })),
    devices: devices.map((device) => ({
      id: String(device.id),
      name: String(device.device_name),
      softwareVersion: String(device.software_version ?? ""),
      status: String(device.status),
      pairedAt: String(device.paired_at),
      lastSeenAt: device.last_seen_at ? String(device.last_seen_at) : null,
      lastSyncAt: device.last_sync_at ? String(device.last_sync_at) : null,
      online: Boolean(device.online),
      diagnostics: device.diagnostic_status ? {
        status: String(device.diagnostic_status),
        checks: JSON.parse(String(device.diagnostic_checks ?? "{}")),
        uptimeSeconds: Number(device.uptime_seconds ?? 0),
        reportedAt: device.diagnostics_reported_at ? String(device.diagnostics_reported_at) : null,
      } : null,
    })),
  };
}

export async function adminOverview() {
  const sql = db();
  const [counts, users, profiles] = await Promise.all([
    sql<{ users: number; profiles: number; memberships: number }[]>`
      SELECT
        (SELECT count(*)::int FROM users WHERE active = true) AS users,
        (SELECT count(*)::int FROM senior_profiles WHERE status <> 'archived') AS profiles,
        (SELECT count(*)::int FROM profile_memberships) AS memberships
    `,
    sql<Record<string, string | boolean>[]>`
      SELECT id, email, display_name, role, active, must_change_password, created_at::text
      FROM users ORDER BY created_at DESC LIMIT 50
    `,
    sql<Record<string, string | null>[]>`
      SELECT id, profile_label, preferred_name, status, privacy_mode, created_at::text
      FROM senior_profiles ORDER BY created_at DESC LIMIT 50
    `,
  ]);
  return { counts: counts[0] ?? { users: 0, profiles: 0, memberships: 0 }, users, profiles };
}

export async function writeAudit(actorId: string | null, action: string, profileId: string | null = null, detail: Record<string, AuditJsonValue | undefined> = {}) {
  const sql = db();
  await sql`INSERT INTO audit_events (actor_id, profile_id, action, detail) VALUES (${actorId}, ${profileId}, ${action}, ${sql.json(detail)})`;
}
