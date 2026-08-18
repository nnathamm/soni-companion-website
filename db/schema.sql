CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  display_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The first account is the sole site administrator. Everyone invited later is a member.
CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_idx ON users ((role)) WHERE role = 'admin';

CREATE TABLE IF NOT EXISTS admin_setup_tokens (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_setup_tokens_expires_at_idx ON admin_setup_tokens(expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);

CREATE TABLE IF NOT EXISTS senior_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_label text NOT NULL,
  preferred_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  privacy_mode text NOT NULL DEFAULT 'strict' CHECK (privacy_mode IN ('strict', 'standard')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_memberships (
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'family' CHECK (relationship IN ('senior', 'family', 'caregiver', 'coordinator')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, user_id)
);

CREATE TABLE IF NOT EXISTS feature_permissions (
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, feature_key)
);

CREATE TABLE IF NOT EXISTS support_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'connection',
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'completed', 'declined')),
  proposed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES senior_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON profile_memberships(user_id);
CREATE INDEX IF NOT EXISTS feature_permissions_profile_id_idx ON feature_permissions(profile_id);
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS device_pairing_limits (
  key_hash text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);

CREATE TABLE IF NOT EXISTS device_pairing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_code text NOT NULL UNIQUE CHECK (pairing_code ~ '^[0-9]{6}$'),
  device_id text NOT NULL CHECK (device_id ~ '^[a-f0-9]{32}$'),
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  device_name text NOT NULL,
  software_version text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  approved_profile_id uuid REFERENCES senior_profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_pairing_requests_device_idx ON device_pairing_requests(device_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS device_pairing_requests_expires_idx ON device_pairing_requests(expires_at);

CREATE TABLE IF NOT EXISTS household_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  device_id text NOT NULL UNIQUE CHECK (device_id ~ '^[a-f0-9]{32}$'),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  device_name text NOT NULL,
  software_version text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  paired_by uuid REFERENCES users(id) ON DELETE SET NULL,
  paired_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  last_sync_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS household_devices_profile_idx ON household_devices(profile_id, status, paired_at DESC);
CREATE INDEX IF NOT EXISTS household_devices_last_seen_idx ON household_devices(last_seen_at DESC);

-- Household content lives in the cloud. Soni receives only bounded text metadata;
-- private Blob objects are delivered directly to authenticated browser displays.
CREATE TABLE IF NOT EXISTS family_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  blob_url text NOT NULL,
  blob_pathname text NOT NULL UNIQUE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 12582912),
  title text NOT NULL,
  caption text NOT NULL DEFAULT '',
  story_date date,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS family_media_profile_idx ON family_media(profile_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS family_facts_cloud (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  fact_text text NOT NULL,
  source_label text NOT NULL DEFAULT 'Family',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  contributed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS family_facts_cloud_profile_idx ON family_facts_cloud(profile_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS medication_schedules_cloud (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  time_local time NOT NULL,
  days smallint[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  timezone text NOT NULL DEFAULT 'America/Chicago',
  reminder_note text NOT NULL DEFAULT '',
  escalation_minutes integer NOT NULL DEFAULT 30 CHECK (escalation_minutes BETWEEN 5 AND 240),
  enabled boolean NOT NULL DEFAULT true,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (days <@ ARRAY[0,1,2,3,4,5,6]::smallint[] AND cardinality(days) > 0)
);

CREATE INDEX IF NOT EXISTS medication_schedules_cloud_profile_idx ON medication_schedules_cloud(profile_id, enabled, time_local);

CREATE TABLE IF NOT EXISTS remote_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'reminder' CHECK (kind IN ('reminder', 'family_update', 'appointment', 'check_in')),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delivered', 'acknowledged', 'dismissed', 'cancelled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS remote_notifications_profile_idx ON remote_notifications(profile_id, status, scheduled_for DESC);

CREATE TABLE IF NOT EXISTS wellbeing_daily_summaries (
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  summary_date date NOT NULL,
  conversation_count integer NOT NULL DEFAULT 0 CHECK (conversation_count >= 0),
  average_words_per_turn double precision,
  vocabulary_variety double precision,
  tone_balance double precision,
  average_speech_seconds double precision,
  average_pause_count double precision,
  speech_density double precision,
  medication_due_count integer NOT NULL DEFAULT 0,
  medication_acknowledged_count integer NOT NULL DEFAULT 0,
  activity_count integer NOT NULL DEFAULT 0,
  notable_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_device_id uuid REFERENCES household_devices(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, summary_date)
);

CREATE INDEX IF NOT EXISTS wellbeing_daily_summaries_profile_idx ON wellbeing_daily_summaries(profile_id, summary_date DESC);

CREATE TABLE IF NOT EXISTS remote_display_pairing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_code text NOT NULL UNIQUE CHECK (pairing_code ~ '^[0-9]{6}$'),
  display_id text NOT NULL CHECK (display_id ~ '^[a-f0-9]{32}$'),
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  display_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  approved_profile_id uuid REFERENCES senior_profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS remote_display_pairing_device_idx ON remote_display_pairing_requests(display_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS remote_display_pairing_expires_idx ON remote_display_pairing_requests(expires_at);

CREATE TABLE IF NOT EXISTS remote_displays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES senior_profiles(id) ON DELETE CASCADE,
  display_id text NOT NULL UNIQUE CHECK (display_id ~ '^[a-f0-9]{32}$'),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  paired_by uuid REFERENCES users(id) ON DELETE SET NULL,
  paired_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS remote_displays_profile_idx ON remote_displays(profile_id, status, paired_at DESC);
CREATE INDEX IF NOT EXISTS remote_displays_last_seen_idx ON remote_displays(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS remote_display_state (
  profile_id uuid PRIMARY KEY REFERENCES senior_profiles(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 1,
  mode text NOT NULL DEFAULT 'face' CHECK (mode IN ('face', 'conversation', 'memory', 'message', 'reminder', 'welcome')),
  face_state text NOT NULL DEFAULT 'idle' CHECK (face_state IN ('idle', 'listening', 'thinking', 'speaking', 'sleeping', 'error')),
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  user_text text NOT NULL DEFAULT '',
  assistant_text text NOT NULL DEFAULT '',
  media_id uuid REFERENCES family_media(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES remote_notifications(id) ON DELETE SET NULL,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_plan_items ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE support_plan_items ADD COLUMN IF NOT EXISTS target_date date;
ALTER TABLE support_plan_items DROP CONSTRAINT IF EXISTS support_plan_items_priority_check;
ALTER TABLE support_plan_items ADD CONSTRAINT support_plan_items_priority_check CHECK (priority IN ('low', 'normal', 'high'));
