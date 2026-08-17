import { db } from "./db";
import { attemptKey } from "./security";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 6;

export async function loginAllowed(email: string) {
  const key = attemptKey(email);
  const rows = await db()<{ attempts: number; blocked: boolean }[]>`
    SELECT
      CASE
        WHEN window_started_at < now() - (${WINDOW_MINUTES} * interval '1 minute') THEN 0
        ELSE attempts
      END AS attempts,
      (blocked_until IS NOT NULL AND blocked_until > now()) AS blocked
    FROM login_attempts WHERE key_hash = ${key}
  `;
  return !rows[0]?.blocked && (rows[0]?.attempts ?? 0) < MAX_ATTEMPTS;
}

export async function recordLoginFailure(email: string) {
  const key = attemptKey(email);
  await db()`
    INSERT INTO login_attempts (key_hash, attempts, window_started_at, blocked_until)
    VALUES (${key}, 1, now(), NULL)
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN login_attempts.window_started_at < now() - (${WINDOW_MINUTES} * interval '1 minute') THEN 1
        ELSE login_attempts.attempts + 1
      END,
      window_started_at = CASE
        WHEN login_attempts.window_started_at < now() - (${WINDOW_MINUTES} * interval '1 minute') THEN now()
        ELSE login_attempts.window_started_at
      END,
      blocked_until = CASE
        WHEN login_attempts.window_started_at < now() - (${WINDOW_MINUTES} * interval '1 minute') THEN NULL
        WHEN login_attempts.attempts + 1 >= ${MAX_ATTEMPTS} THEN now() + (${WINDOW_MINUTES} * interval '1 minute')
        ELSE login_attempts.blocked_until
      END
  `;
}

export async function clearLoginFailures(email: string) {
  await db()`DELETE FROM login_attempts WHERE key_hash = ${attemptKey(email)}`;
}
