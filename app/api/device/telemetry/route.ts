import { NextRequest } from "next/server";
import { authenticateDevice } from "@/lib/device-auth";
import { deviceError } from "@/lib/device-response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function boundedNumber(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : null;
}

export async function POST(request: NextRequest) {
  try {
    const device = await authenticateDevice(request);
    const body = await request.json().catch(() => { throw new Error("invalid_json"); }) as Record<string, unknown>;
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("invalid_input");
    const conversations = Math.trunc(boundedNumber(body.conversationCount, 0, 500) ?? 0);
    const medicationDue = Math.trunc(boundedNumber(body.medicationDueCount, 0, 100) ?? 0);
    const medicationAcknowledged = Math.trunc(boundedNumber(body.medicationAcknowledgedCount, 0, 100) ?? 0);
    const activities = Math.trunc(boundedNumber(body.activityCount, 0, 100) ?? 0);
    const notable = Array.isArray(body.notableChanges) ? body.notableChanges.map(String).map((item) => item.slice(0, 140)).slice(0, 8) : [];
    await db()`
      INSERT INTO wellbeing_daily_summaries (
        profile_id, summary_date, conversation_count, average_words_per_turn, vocabulary_variety,
        tone_balance, average_speech_seconds, average_pause_count, speech_density,
        medication_due_count, medication_acknowledged_count, activity_count, notable_changes, source_device_id
      ) VALUES (
        ${device.profileId}, ${date}, ${conversations}, ${boundedNumber(body.averageWordsPerTurn, 0, 1000)},
        ${boundedNumber(body.vocabularyVariety, 0, 1)}, ${boundedNumber(body.toneBalance, -1, 1)},
        ${boundedNumber(body.averageSpeechSeconds, 0, 600)}, ${boundedNumber(body.averagePauseCount, 0, 100)},
        ${boundedNumber(body.speechDensity, 0, 1)}, ${medicationDue}, ${medicationAcknowledged}, ${activities},
        ${JSON.stringify(notable)}::jsonb, ${device.id}
      ) ON CONFLICT (profile_id, summary_date) DO UPDATE SET
        conversation_count=EXCLUDED.conversation_count, average_words_per_turn=EXCLUDED.average_words_per_turn,
        vocabulary_variety=EXCLUDED.vocabulary_variety, tone_balance=EXCLUDED.tone_balance,
        average_speech_seconds=EXCLUDED.average_speech_seconds, average_pause_count=EXCLUDED.average_pause_count,
        speech_density=EXCLUDED.speech_density, medication_due_count=EXCLUDED.medication_due_count,
        medication_acknowledged_count=EXCLUDED.medication_acknowledged_count, activity_count=EXCLUDED.activity_count,
        notable_changes=EXCLUDED.notable_changes, source_device_id=EXCLUDED.source_device_id, updated_at=now()
    `;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return deviceError(error);
  }
}
