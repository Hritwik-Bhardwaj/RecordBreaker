-- =============================================================
-- RecordBreaker — Full PostgreSQL Schema
-- =============================================================

-- ── ENUM TYPES ────────────────────────────────────────────────

CREATE TYPE gender_enum AS ENUM ('men', 'women');

CREATE TYPE age_bracket_enum AS ENUM (
  'junior',       -- 16–23
  'main',         -- 24–34
  'senior',       -- 35–49
  'senior_i',     -- 50–59
  'senior_ii',    -- 60–69
  'senior_iii'    -- 70+
);

CREATE TYPE weight_class_enum AS ENUM (
  'lightweight',
  'middleweight',
  'light_heavyweight',
  'heavyweight'
);

CREATE TYPE record_status_enum AS ENUM (
  'pending',
  'approved',
  'rejected',
  'flagged',
  'removed'
);

CREATE TYPE submission_status_enum AS ENUM (
  'pending',
  'ai_approved',
  'ai_flagged',
  'manually_approved',
  'manually_rejected',
  'flagged_for_proof'
);

CREATE TYPE notification_type_enum AS ENUM (
  'record_approved',
  'record_rejected',
  'new_follower',
  'new_record_on_followed_leaderboard',
  'followed_user_record',
  'new_comment',
  'new_dm'
);

CREATE TYPE exercise_category_enum AS ENUM (
  'push_bodyweight',
  'push_equipment',
  'pull_bodyweight',
  'dips',
  'legs',
  'full_body',
  'static_holds'
);

CREATE TYPE format_type_enum AS ENUM (
  'max_reps',
  'timed_reps',
  'weight_based',
  'max_time_hold'
);

-- ── USERS ─────────────────────────────────────────────────────

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  password_hash       TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              gender_enum NOT NULL,
  body_weight_kg      DECIMAL(5, 2) NOT NULL,
  weight_class        weight_class_enum NOT NULL,
  state               TEXT,
  country             TEXT NOT NULL,
  profile_photo_url   TEXT,
  bio                 TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_min_age CHECK (
    date_of_birth <= (CURRENT_DATE - INTERVAL '16 years')
  )
);

CREATE INDEX idx_users_country ON users (country);
CREATE INDEX idx_users_email ON users (email);

-- ── EXERCISES ─────────────────────────────────────────────────

CREATE TABLE exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  category              exercise_category_enum NOT NULL,
  description           TEXT,
  uses_regulated_weight BOOLEAN NOT NULL DEFAULT false,
  enabled               BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_category ON exercises (category);
CREATE INDEX idx_exercises_enabled ON exercises (enabled);

-- ── EXERCISE_VARIATIONS ───────────────────────────────────────

CREATE TABLE exercise_variations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id         UUID NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  format_type         format_type_enum NOT NULL,
  time_limit_seconds  INT,
  rules_text          TEXT,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variations_exercise_id ON exercise_variations (exercise_id);
CREATE INDEX idx_variations_enabled ON exercise_variations (enabled);

-- ── RECORDS ───────────────────────────────────────────────────
-- Immutable once approved. New rows only — never update approved records.

CREATE TABLE records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  variation_id          UUID NOT NULL REFERENCES exercise_variations (id) ON DELETE CASCADE,
  gender                gender_enum NOT NULL,
  age_bracket           age_bracket_enum NOT NULL,
  weight_class          weight_class_enum NOT NULL,
  country               TEXT NOT NULL,
  state                 TEXT,
  value_reps            INT,
  value_weight_kg       DECIMAL(6, 2),
  value_time_seconds    INT,
  added_weight_kg       DECIMAL(5, 2),
  regulated_weight_kg   DECIMAL(5, 2),
  status                record_status_enum NOT NULL DEFAULT 'pending',
  video_url             TEXT NOT NULL,
  overlay_video_url     TEXT,
  approved_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  removed_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critical composite index for all leaderboard queries
CREATE INDEX idx_records_leaderboard ON records (
  variation_id, gender, age_bracket, weight_class, country, status
);
CREATE INDEX idx_records_user_id ON records (user_id);
CREATE INDEX idx_records_status ON records (status);
CREATE INDEX idx_records_approved_at ON records (approved_at);

-- ── LEADERBOARD_RANKS ─────────────────────────────────────────
-- Regular table (NOT a materialised view). Truncated and rebuilt per combination
-- whenever a record in that combination is approved.
-- country = NULL means global leaderboard.

CREATE TABLE leaderboard_ranks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id  UUID NOT NULL REFERENCES exercise_variations (id) ON DELETE CASCADE,
  gender        gender_enum NOT NULL,
  age_bracket   age_bracket_enum NOT NULL,
  weight_class  weight_class_enum NOT NULL,
  country       TEXT,
  rank          INT NOT NULL,
  record_id     UUID NOT NULL REFERENCES records (id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_leaderboard_rank UNIQUE (
    variation_id, gender, age_bracket, weight_class, country, rank
  )
);

CREATE INDEX idx_leaderboard_ranks_lookup ON leaderboard_ranks (
  variation_id, gender, age_bracket, weight_class, country
);
CREATE INDEX idx_leaderboard_ranks_user ON leaderboard_ranks (user_id);

-- ── SUBMISSIONS ───────────────────────────────────────────────

CREATE TABLE submissions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  variation_id                UUID NOT NULL REFERENCES exercise_variations (id) ON DELETE CASCADE,
  gender                      gender_enum NOT NULL,
  age_bracket                 age_bracket_enum NOT NULL,
  weight_class                weight_class_enum NOT NULL,
  country                     TEXT NOT NULL,
  state                       TEXT,
  claimed_value_reps          INT,
  claimed_value_weight_kg     DECIMAL(6, 2),
  claimed_value_time_seconds  INT,
  claimed_added_weight_kg     DECIMAL(5, 2),
  video_url                   TEXT NOT NULL,
  status                      submission_status_enum NOT NULL DEFAULT 'pending',
  ai_verdict                  JSONB,
  ai_confidence_score         DECIMAL(4, 3),
  moderator_id                UUID REFERENCES users (id) ON DELETE SET NULL,
  moderator_note              TEXT,
  is_minor                    BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_user_id ON submissions (user_id);
CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_variation ON submissions (variation_id);

-- ── WEIGHT_CLASS_HISTORY ──────────────────────────────────────

CREATE TABLE weight_class_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  old_weight_kg     DECIMAL(5, 2) NOT NULL,
  new_weight_kg     DECIMAL(5, 2) NOT NULL,
  old_weight_class  weight_class_enum NOT NULL,
  new_weight_class  weight_class_enum NOT NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weight_history_user ON weight_class_history (user_id);

-- ── REGION_HISTORY ────────────────────────────────────────────

CREATE TABLE region_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  old_state   TEXT,
  old_country TEXT NOT NULL,
  new_state   TEXT,
  new_country TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_region_history_user ON region_history (user_id);

-- ── FOLLOWS_USERS ─────────────────────────────────────────────

CREATE TABLE follows_users (
  follower_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  followee_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> followee_id)
);

CREATE INDEX idx_follows_users_followee ON follows_users (followee_id);

-- ── FOLLOWS_LEADERBOARDS ──────────────────────────────────────
-- country = NULL means following the global leaderboard for that combination.

CREATE TABLE follows_leaderboards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  variation_id  UUID NOT NULL REFERENCES exercise_variations (id) ON DELETE CASCADE,
  gender        gender_enum NOT NULL,
  age_bracket   age_bracket_enum NOT NULL,
  weight_class  weight_class_enum NOT NULL,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_follows_leaderboard UNIQUE (
    user_id, variation_id, gender, age_bracket, weight_class, country
  )
);

CREATE INDEX idx_follows_lb_user ON follows_leaderboards (user_id);
CREATE INDEX idx_follows_lb_variation ON follows_leaderboards (variation_id);

-- ── COMMENTS ─────────────────────────────────────────────────
-- Threaded to a leaderboard combination (not to an individual record).
-- country = NULL means comment is on the global leaderboard.

CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id  UUID NOT NULL REFERENCES exercise_variations (id) ON DELETE CASCADE,
  gender        gender_enum NOT NULL,
  age_bracket   age_bracket_enum NOT NULL,
  weight_class  weight_class_enum NOT NULL,
  country       TEXT,
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_reported   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_leaderboard ON comments (
  variation_id, gender, age_bracket, weight_class, country
);
CREATE INDEX idx_comments_user ON comments (user_id);

-- ── MESSAGES ──────────────────────────────────────────────────

CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at      TIMESTAMPTZ,
  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_messages_receiver ON messages (receiver_id, sent_at DESC);
CREATE INDEX idx_messages_sender ON messages (sender_id, sent_at DESC);

-- ── NOTIFICATIONS ─────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        notification_type_enum NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

-- ── REGULATED_WEIGHT_OPTIONS ──────────────────────────────────

CREATE TABLE regulated_weight_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_kg  DECIMAL(5, 2) NOT NULL UNIQUE
);

INSERT INTO regulated_weight_options (weight_kg) VALUES
  (5), (10), (15), (20), (25), (30), (35), (40),
  (50), (60), (70), (80), (100), (110), (120), (130), (140), (150);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_ranks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_class_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulated_weight_options ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_records"
  ON records FOR SELECT USING (true);

CREATE POLICY "public_read_leaderboard_ranks"
  ON leaderboard_ranks FOR SELECT USING (true);

CREATE POLICY "public_read_exercises"
  ON exercises FOR SELECT USING (true);

CREATE POLICY "public_read_variations"
  ON exercise_variations FOR SELECT USING (true);

CREATE POLICY "public_read_regulated_weights"
  ON regulated_weight_options FOR SELECT USING (true);

CREATE POLICY "public_read_users"
  ON users FOR SELECT USING (true);

CREATE POLICY "public_read_comments"
  ON comments FOR SELECT USING (true);

CREATE POLICY "public_read_follows_users"
  ON follows_users FOR SELECT USING (true);

-- Owner-only read policies
CREATE POLICY "owner_read_submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner_read_messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "owner_read_notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner_read_weight_history"
  ON weight_class_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner_read_region_history"
  ON region_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "owner_read_follows_leaderboards"
  ON follows_leaderboards FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================
-- HELPER FUNCTION: compute weight class from gender + weight
-- =============================================================

CREATE OR REPLACE FUNCTION compute_weight_class(
  p_gender     gender_enum,
  p_weight_kg  DECIMAL
) RETURNS weight_class_enum AS $$
BEGIN
  IF p_gender = 'men' THEN
    IF p_weight_kg < 65    THEN RETURN 'lightweight';
    ELSIF p_weight_kg < 80 THEN RETURN 'middleweight';
    ELSIF p_weight_kg < 95 THEN RETURN 'light_heavyweight';
    ELSE                        RETURN 'heavyweight';
    END IF;
  ELSE -- women
    IF p_weight_kg < 55    THEN RETURN 'lightweight';
    ELSIF p_weight_kg < 70 THEN RETURN 'middleweight';
    ELSIF p_weight_kg < 85 THEN RETURN 'light_heavyweight';
    ELSE                        RETURN 'heavyweight';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================
-- HELPER FUNCTION: compute age bracket from date of birth
-- =============================================================

CREATE OR REPLACE FUNCTION compute_age_bracket(
  p_dob DATE
) RETURNS age_bracket_enum AS $$
DECLARE
  v_age INT;
BEGIN
  v_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_dob));
  IF v_age < 24     THEN RETURN 'junior';
  ELSIF v_age < 35  THEN RETURN 'main';
  ELSIF v_age < 50  THEN RETURN 'senior';
  ELSIF v_age < 60  THEN RETURN 'senior_i';
  ELSIF v_age < 70  THEN RETURN 'senior_ii';
  ELSE                   RETURN 'senior_iii';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
