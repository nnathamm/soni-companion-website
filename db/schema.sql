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
