import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed demo profiles.");

const profiles = [
  { label: "Demo home · Margaret", preferredName: "Margaret" },
  { label: "Demo home · Walter", preferredName: "Walter" },
  { label: "Demo home · June", preferredName: "June" },
];

const featureKeys = [
  "media_enrichment",
  "gentle_activities",
  "wellbeing_patterns",
  "medication_support",
  "care_planning",
  "trusted_displays",
];

const sql = postgres(databaseUrl, { max: 1, ssl: "require", prepare: false });

try {
  const admins = await sql`SELECT id FROM users WHERE role = 'admin' AND active = true LIMIT 1`;
  if (!admins.length) throw new Error("An active administrator account is required before seeding demos.");
  const adminId = admins[0].id;

  await sql.begin(async (transaction) => {
    for (const profile of profiles) {
      const existing = await transaction`
        SELECT id FROM senior_profiles
        WHERE profile_label = ${profile.label} AND created_by = ${adminId}
        ORDER BY created_at ASC LIMIT 1
      `;
      const profileId = existing[0]?.id ?? (await transaction`
        INSERT INTO senior_profiles (profile_label, preferred_name, privacy_mode, created_by)
        VALUES (${profile.label}, ${profile.preferredName}, 'standard', ${adminId})
        RETURNING id
      `)[0].id;

      await transaction`
        UPDATE senior_profiles
        SET preferred_name = ${profile.preferredName}, status = 'active', privacy_mode = 'standard', updated_at = now()
        WHERE id = ${profileId}
      `;

      for (const featureKey of featureKeys) {
        await transaction`
          INSERT INTO feature_permissions (profile_id, feature_key, enabled, approved_by, approved_at, updated_at)
          VALUES (${profileId}, ${featureKey}, true, ${adminId}, now(), now())
          ON CONFLICT (profile_id, feature_key) DO UPDATE SET
            enabled = true,
            approved_by = EXCLUDED.approved_by,
            approved_at = COALESCE(feature_permissions.approved_at, EXCLUDED.approved_at),
            updated_at = now()
        `;
      }

      if (!existing.length) {
        await transaction`
          INSERT INTO audit_events (actor_id, profile_id, action, detail)
          VALUES (${adminId}, ${profileId}, 'demo_profile.seeded', ${JSON.stringify({ synthetic: true })}::jsonb)
        `;
      }
    }
  });

  console.log("Three synthetic Soni showcase profiles are ready.");
} finally {
  await sql.end();
}
