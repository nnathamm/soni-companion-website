import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed demo profiles.");
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required to seed private demo media.");

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const featureKeys = [
  "media_enrichment", "gentle_activities", "wellbeing_patterns",
  "medication_support", "care_planning", "trusted_displays",
];

const profiles = [
  {
    label: "Demo home · Margaret", preferredName: "Margaret", image: "living-memory-mosaic.webp",
    mediaTitle: "The roses behind the first house",
    mediaCaption: "A synthetic collection of garden, lakeside, and birthday memories used only for the Soni showcase.",
    tags: ["roses", "garden", "lake", "family", "birthday"],
    facts: [
      "Margaret’s favorite climbers grew beside the kitchen window.",
      "The family’s Lake Michigan picnic tradition began in the 1970s.",
      "Margaret enjoys talking about gardening after a soft summer rain.",
    ],
    medications: [["Morning medication", "08:00"], ["Evening medication", "18:00"]],
    plans: [
      ["Plan a garden-center visit", "Ask Margaret which Saturday feels best before involving family.", "connection", "normal"],
      ["Keep evening calls predictable", "Coordinate a regular family call around Margaret’s preferred routine.", "routine", "normal"],
    ],
    trend: "steady",
  },
  {
    label: "Demo home · Walter", preferredName: "Walter", image: "workshop-memory-mosaic.webp",
    mediaTitle: "The radio that came back to life",
    mediaCaption: "Synthetic workshop, fishing, and neighborhood images for demonstrating story enrichment.",
    tags: ["radio", "workshop", "fishing", "tools", "cookout"],
    facts: [
      "Walter listened for the hum before reaching for a screwdriver.",
      "Walter taught his grandson how to identify old radio tubes.",
      "Fishing trips on the Great Lakes are among Walter’s favorite stories.",
    ],
    medications: [["Morning medication", "09:00"], ["Midday medication", "13:00"]],
    plans: [
      ["Friendly afternoon check-in", "Ask about sleep, lunch, and how Walter is feeling before interpreting any pattern.", "connection", "high"],
      ["Record a radio story", "Invite Walter to create a keepsake only if he wants to.", "connection", "normal"],
    ],
    trend: "review",
  },
  {
    label: "Demo home · June", preferredName: "June", image: "music-memory-mosaic.webp",
    mediaTitle: "The song everyone knew",
    mediaCaption: "Synthetic music-night, community-dance, and baking memories for the Soni showcase.",
    tags: ["music", "piano", "dance", "family", "baking"],
    facts: [
      "June remembers family songs by when everyone joined in after supper.",
      "Community dances were an important part of June’s early adulthood.",
      "June enjoys choosing between a song, a photograph, and a story prompt.",
    ],
    medications: [["Morning medication", "08:30"], ["Evening medication", "20:30"]],
    plans: [
      ["Sunday music hour", "Coordinate the television display and family call around June’s preferred time.", "connection", "normal"],
      ["Build a song memory collection", "Add titles one at a time with June’s personal context.", "routine", "low"],
    ],
    trend: "positive",
  },
];

const sql = postgres(databaseUrl, { max: 1, ssl: "require", prepare: false });

try {
  const admins = await sql`SELECT id FROM users WHERE role = 'admin' AND active = true LIMIT 1`;
  if (!admins.length) throw new Error("An active administrator account is required before seeding demos.");
  const adminId = admins[0].id;

  for (const profile of profiles) {
    const existing = await sql`
      SELECT id FROM senior_profiles WHERE profile_label=${profile.label} AND created_by=${adminId}
      ORDER BY created_at ASC LIMIT 1
    `;
    const profileId = existing[0]?.id ?? (await sql`
      INSERT INTO senior_profiles (profile_label, preferred_name, privacy_mode, created_by)
      VALUES (${profile.label}, ${profile.preferredName}, 'standard', ${adminId}) RETURNING id
    `)[0].id;

    await sql`
      UPDATE senior_profiles SET preferred_name=${profile.preferredName}, status='active',
        privacy_mode='standard', updated_at=now() WHERE id=${profileId}
    `;
    for (const featureKey of featureKeys) {
      await sql`
        INSERT INTO feature_permissions (profile_id, feature_key, enabled, approved_by, approved_at, updated_at)
        VALUES (${profileId}, ${featureKey}, true, ${adminId}, now(), now())
        ON CONFLICT (profile_id, feature_key) DO UPDATE SET enabled=true, approved_by=EXCLUDED.approved_by,
          approved_at=COALESCE(feature_permissions.approved_at, EXCLUDED.approved_at), updated_at=now()
      `;
    }

    const mediaRows = await sql`SELECT id FROM family_media WHERE profile_id=${profileId} AND title=${profile.mediaTitle} LIMIT 1`;
    if (!mediaRows.length) {
      const imagePath = path.join(root, "public", "images", "demo", profile.image);
      const image = await fs.readFile(imagePath);
      const blob = await put(`showcase/${profileId}/${profile.image}`, image, {
        access: "private", addRandomSuffix: true, contentType: "image/webp", cacheControlMaxAge: 3600,
      });
      await sql`
        INSERT INTO family_media (
          profile_id, blob_url, blob_pathname, content_type, size_bytes, title, caption,
          story_date, tags, uploaded_by
        ) VALUES (${profileId}, ${blob.url}, ${blob.pathname}, 'image/webp', ${image.length},
          ${profile.mediaTitle}, ${profile.mediaCaption}, '1976-07-18', ${profile.tags}, ${adminId})
      `;
    }

    for (const fact of profile.facts) {
      await sql`
        INSERT INTO family_facts_cloud (profile_id, fact_text, source_label, contributed_by)
        SELECT ${profileId}, ${fact}, 'Synthetic showcase', ${adminId}
        WHERE NOT EXISTS (SELECT 1 FROM family_facts_cloud WHERE profile_id=${profileId} AND fact_text=${fact})
      `;
    }
    for (const [label, timeLocal] of profile.medications) {
      await sql`
        INSERT INTO medication_schedules_cloud (profile_id, label, time_local, verified_by)
        SELECT ${profileId}, ${label}, ${timeLocal}, ${adminId}
        WHERE NOT EXISTS (SELECT 1 FROM medication_schedules_cloud WHERE profile_id=${profileId} AND label=${label} AND time_local=${timeLocal})
      `;
    }
    for (const [title, details, category, priority] of profile.plans) {
      await sql`
        INSERT INTO support_plan_items (profile_id, title, details, category, status, priority, proposed_by)
        SELECT ${profileId}, ${title}, ${details}, ${category}, 'approved', ${priority}, ${adminId}
        WHERE NOT EXISTS (SELECT 1 FROM support_plan_items WHERE profile_id=${profileId} AND title=${title})
      `;
    }

    for (let offset = 20; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 86400_000).toISOString().slice(0, 10);
      const progress = 20 - offset;
      const conversations = profile.trend === "review" ? Math.max(1, 5 - Math.floor(progress / 6)) : 3 + (progress % 3);
      const words = profile.trend === "review" ? 44 - progress * 0.55 : profile.trend === "positive" ? 34 + progress * 0.65 : 39 + Math.sin(progress) * 2;
      const pauses = profile.trend === "review" ? 2.5 + progress * 0.09 : 2.2 + Math.sin(progress / 2) * 0.2;
      const tone = profile.trend === "positive" ? 0.05 + progress * 0.006 : 0.05 + Math.sin(progress / 3) * 0.01;
      await sql`
        INSERT INTO wellbeing_daily_summaries (
          profile_id, summary_date, conversation_count, average_words_per_turn,
          vocabulary_variety, tone_balance, average_speech_seconds, average_pause_count,
          speech_density, medication_due_count, medication_acknowledged_count,
          activity_count, notable_changes
        ) VALUES (${profileId}, ${date}, ${conversations}, ${words}, ${0.63 + Math.sin(progress / 3) * 0.02},
          ${tone}, ${18 + Math.sin(progress / 2) * 2}, ${pauses}, ${0.74 - pauses * 0.02}, 2,
          ${offset % 5 === 0 ? 1 : 2}, ${1 + (progress % 2)},
          ${sql.json(profile.trend === "review" && offset < 4 ? [{ metric: "pause_count", direction: "higher", nonDiagnostic: true }] : [])})
        ON CONFLICT (profile_id, summary_date) DO UPDATE SET
          conversation_count=EXCLUDED.conversation_count, average_words_per_turn=EXCLUDED.average_words_per_turn,
          vocabulary_variety=EXCLUDED.vocabulary_variety, tone_balance=EXCLUDED.tone_balance,
          average_speech_seconds=EXCLUDED.average_speech_seconds, average_pause_count=EXCLUDED.average_pause_count,
          speech_density=EXCLUDED.speech_density, medication_due_count=EXCLUDED.medication_due_count,
          medication_acknowledged_count=EXCLUDED.medication_acknowledged_count,
          activity_count=EXCLUDED.activity_count, notable_changes=EXCLUDED.notable_changes, updated_at=now()
      `;
    }

    const upcoming = new Date(Date.now() + 6 * 60 * 60_000);
    await sql`
      INSERT INTO remote_notifications (profile_id, kind, title, message, scheduled_for, created_by)
      SELECT ${profileId}, 'family_update', 'A family hello',
        'Someone in your family is thinking of you and will check in later today.', ${upcoming}, ${adminId}
      WHERE NOT EXISTS (
        SELECT 1 FROM remote_notifications WHERE profile_id=${profileId} AND title='A family hello'
          AND status='scheduled' AND scheduled_for > now()
      )
    `;
    if (!existing.length) {
      await sql`
        INSERT INTO audit_events (actor_id, profile_id, action, detail)
        VALUES (${adminId}, ${profileId}, 'demo_profile.seeded', ${sql.json({ synthetic: true, databaseBacked: true })})
      `;
    }
  }

  console.log("Three database-backed synthetic Soni showcase profiles are ready.");
} finally {
  await sql.end();
}
