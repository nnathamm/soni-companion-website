import { db } from "./db";

type Row = Record<string, string | number | boolean | string[] | null>;

function iso(value: unknown) {
  return value ? String(value) : null;
}

export async function householdWorkspace(profileId: string) {
  const sql = db();
  const [media, facts, medications, plans, notifications, displays, trends, displayState] = await Promise.all([
    sql<Row[]>`
      SELECT id, title, caption, story_date::text, tags, content_type, size_bytes, status, created_at::text
      FROM family_media WHERE profile_id = ${profileId} AND status = 'active'
      ORDER BY created_at DESC LIMIT 100
    `,
    sql<Row[]>`
      SELECT id, fact_text, source_label, status, created_at::text
      FROM family_facts_cloud WHERE profile_id = ${profileId} AND status = 'active'
      ORDER BY created_at DESC LIMIT 200
    `,
    sql<Row[]>`
      SELECT id, label, to_char(time_local, 'HH24:MI') AS time_local, days, timezone,
        reminder_note, escalation_minutes, enabled, updated_at::text
      FROM medication_schedules_cloud WHERE profile_id = ${profileId}
      ORDER BY time_local, label
    `,
    sql<Row[]>`
      SELECT id, title, details, category, status, priority, target_date::text, updated_at::text
      FROM support_plan_items WHERE profile_id = ${profileId}
      ORDER BY status = 'approved' DESC, updated_at DESC LIMIT 100
    `,
    sql<Row[]>`
      SELECT id, kind, title, message, scheduled_for::text, status, delivered_at::text,
        acknowledged_at::text, updated_at::text
      FROM remote_notifications WHERE profile_id = ${profileId}
      ORDER BY scheduled_for DESC LIMIT 100
    `,
    sql<Row[]>`
      SELECT id, display_name, status, paired_at::text, last_seen_at::text,
        (status = 'active' AND last_seen_at > now() - interval '45 seconds') AS online
      FROM remote_displays WHERE profile_id = ${profileId}
      ORDER BY status = 'active' DESC, paired_at DESC
    `,
    sql<Row[]>`
      SELECT summary_date::text, conversation_count, average_words_per_turn, vocabulary_variety,
        tone_balance, average_speech_seconds, average_pause_count, speech_density,
        medication_due_count, medication_acknowledged_count, activity_count, notable_changes::text
      FROM wellbeing_daily_summaries WHERE profile_id = ${profileId}
      ORDER BY summary_date DESC LIMIT 45
    `,
    sql<Row[]>`
      SELECT revision, mode, face_state, title, caption, media_id, notification_id,
        expires_at::text, updated_at::text
      FROM remote_display_state WHERE profile_id = ${profileId} LIMIT 1
    `,
  ]);

  return {
    media: media.map((item) => ({
      id: String(item.id), title: String(item.title), caption: String(item.caption ?? ""),
      storyDate: iso(item.story_date), tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      contentType: String(item.content_type), sizeBytes: Number(item.size_bytes), createdAt: String(item.created_at),
      previewUrl: `/api/profile/${profileId}/media/${item.id}`,
    })),
    facts: facts.map((item) => ({ id: String(item.id), text: String(item.fact_text), source: String(item.source_label), createdAt: String(item.created_at) })),
    medications: medications.map((item) => ({
      id: String(item.id), label: String(item.label), timeLocal: String(item.time_local),
      days: Array.isArray(item.days) ? item.days.map(Number) : [], timezone: String(item.timezone),
      note: String(item.reminder_note ?? ""), escalationMinutes: Number(item.escalation_minutes), enabled: Boolean(item.enabled),
    })),
    plans: plans.map((item) => ({
      id: String(item.id), title: String(item.title), details: String(item.details ?? ""), category: String(item.category),
      status: String(item.status), priority: String(item.priority), targetDate: iso(item.target_date), updatedAt: String(item.updated_at),
    })),
    notifications: notifications.map((item) => ({
      id: String(item.id), kind: String(item.kind), title: String(item.title), message: String(item.message ?? ""),
      scheduledFor: String(item.scheduled_for), status: String(item.status), deliveredAt: iso(item.delivered_at),
      acknowledgedAt: iso(item.acknowledged_at),
    })),
    displays: displays.map((item) => ({
      id: String(item.id), name: String(item.display_name), status: String(item.status), pairedAt: String(item.paired_at),
      lastSeenAt: iso(item.last_seen_at), online: Boolean(item.online),
    })),
    trends: trends.map((item) => ({
      date: String(item.summary_date), conversations: Number(item.conversation_count),
      wordsPerTurn: item.average_words_per_turn === null ? null : Number(item.average_words_per_turn),
      vocabulary: item.vocabulary_variety === null ? null : Number(item.vocabulary_variety),
      tone: item.tone_balance === null ? null : Number(item.tone_balance),
      speechSeconds: item.average_speech_seconds === null ? null : Number(item.average_speech_seconds),
      pauses: item.average_pause_count === null ? null : Number(item.average_pause_count),
      speechDensity: item.speech_density === null ? null : Number(item.speech_density),
      medicationDue: Number(item.medication_due_count), medicationAcknowledged: Number(item.medication_acknowledged_count),
      activities: Number(item.activity_count), notableChanges: JSON.parse(String(item.notable_changes ?? "[]")),
    })).reverse(),
    displayState: displayState[0] ? {
      revision: Number(displayState[0].revision), mode: String(displayState[0].mode), faceState: String(displayState[0].face_state),
      title: String(displayState[0].title ?? ""), caption: String(displayState[0].caption ?? ""),
      mediaId: iso(displayState[0].media_id), notificationId: iso(displayState[0].notification_id),
      expiresAt: iso(displayState[0].expires_at), updatedAt: String(displayState[0].updated_at),
    } : null,
  };
}

export type HouseholdWorkspace = Awaited<ReturnType<typeof householdWorkspace>>;

export async function cloudContentForProfile(profileId: string) {
  const sql = db();
  const [media, facts, medications, plans, notifications, versions] = await Promise.all([
    sql<Row[]>`
      SELECT id, title, caption, story_date::text, tags, updated_at::text
      FROM family_media WHERE profile_id = ${profileId} AND status = 'active'
      ORDER BY created_at DESC LIMIT 75
    `,
    sql<Row[]>`
      SELECT id, fact_text, source_label, updated_at::text
      FROM family_facts_cloud WHERE profile_id = ${profileId} AND status = 'active'
      ORDER BY created_at DESC LIMIT 150
    `,
    sql<Row[]>`
      SELECT id, label, to_char(time_local, 'HH24:MI') AS time_local, days, timezone,
        reminder_note, escalation_minutes, enabled, updated_at::text
      FROM medication_schedules_cloud WHERE profile_id = ${profileId}
      ORDER BY time_local, label LIMIT 50
    `,
    sql<Row[]>`
      SELECT id, title, details, category, status, priority, target_date::text, updated_at::text
      FROM support_plan_items WHERE profile_id = ${profileId} AND status <> 'declined'
      ORDER BY updated_at DESC LIMIT 75
    `,
    sql<Row[]>`
      SELECT id, kind, title, message, scheduled_for::text, status, updated_at::text
      FROM remote_notifications
      WHERE profile_id = ${profileId} AND status = 'scheduled'
        AND scheduled_for BETWEEN now() - interval '30 minutes' AND now() + interval '7 days'
      ORDER BY scheduled_for LIMIT 50
    `,
    sql<{ version: string }[]>`
      SELECT GREATEST(
        p.updated_at,
        COALESCE((SELECT max(updated_at) FROM family_media WHERE profile_id=p.id), p.updated_at),
        COALESCE((SELECT max(updated_at) FROM family_facts_cloud WHERE profile_id=p.id), p.updated_at),
        COALESCE((SELECT max(updated_at) FROM medication_schedules_cloud WHERE profile_id=p.id), p.updated_at),
        COALESCE((SELECT max(updated_at) FROM support_plan_items WHERE profile_id=p.id), p.updated_at),
        COALESCE((SELECT max(updated_at) FROM remote_notifications WHERE profile_id=p.id), p.updated_at)
      )::text AS version FROM senior_profiles p WHERE p.id=${profileId}
    `,
  ]);
  return {
    version: versions[0]?.version ?? "",
    media: media.map((item) => ({ id: String(item.id), title: String(item.title), caption: String(item.caption ?? ""), storyDate: iso(item.story_date), tags: Array.isArray(item.tags) ? item.tags.map(String) : [] })),
    facts: facts.map((item) => ({ id: String(item.id), text: String(item.fact_text), source: String(item.source_label) })),
    medications: medications.map((item) => ({
      id: String(item.id), label: String(item.label), timeLocal: String(item.time_local), days: Array.isArray(item.days) ? item.days.map(Number) : [],
      timezone: String(item.timezone), note: String(item.reminder_note ?? ""), escalationMinutes: Number(item.escalation_minutes), enabled: Boolean(item.enabled),
    })),
    carePlans: plans.map((item) => ({
      id: String(item.id), title: String(item.title), details: String(item.details ?? ""), category: String(item.category),
      status: String(item.status), priority: String(item.priority), targetDate: iso(item.target_date),
    })),
    notifications: notifications.map((item) => ({
      id: String(item.id), kind: String(item.kind), title: String(item.title), message: String(item.message ?? ""),
      scheduledFor: String(item.scheduled_for), status: String(item.status),
    })),
  };
}
