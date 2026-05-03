-- =============================================================
-- RecordBreaker — Exercise + Variation Seed Data
-- =============================================================
-- All IDs use gen_random_uuid() so each run produces unique UUIDs.
-- Run this AFTER schema.sql in Supabase SQL Editor.
-- =============================================================

DO $$
DECLARE
  -- Push Bodyweight
  e_normal_pushups        UUID := gen_random_uuid();
  e_diamond_pushups       UUID := gen_random_uuid();
  e_archer_pushup         UUID := gen_random_uuid();
  e_single_arm_pushup     UUID := gen_random_uuid();
  e_finger_pushup         UUID := gen_random_uuid();
  e_planche_pushup        UUID := gen_random_uuid();
  e_handstand_pushup      UUID := gen_random_uuid();
  e_90_degree_pushup      UUID := gen_random_uuid();
  e_plyometric_pushup     UUID := gen_random_uuid();
  e_clap_pushup           UUID := gen_random_uuid();
  e_tandem_pushup         UUID := gen_random_uuid();
  -- Push Equipment
  e_bench_press           UUID := gen_random_uuid();
  e_incline_bench_press   UUID := gen_random_uuid();
  e_overhead_press        UUID := gen_random_uuid();
  e_preacher_curl         UUID := gen_random_uuid();
  -- Pull Bodyweight
  e_normal_pullups        UUID := gen_random_uuid();
  e_chest_to_bar_pullup   UUID := gen_random_uuid();
  e_muscle_up             UUID := gen_random_uuid();
  e_single_arm_pullup     UUID := gen_random_uuid();
  e_commando_pullup       UUID := gen_random_uuid();
  e_chin_up               UUID := gen_random_uuid();
  e_lsit_chin_up          UUID := gen_random_uuid();
  -- Dips
  e_parallel_bar_dips     UUID := gen_random_uuid();
  e_ring_dips             UUID := gen_random_uuid();
  e_korean_dips           UUID := gen_random_uuid();
  e_impossible_dips       UUID := gen_random_uuid();
  -- Legs
  e_squat                 UUID := gen_random_uuid();
  e_leg_extension         UUID := gen_random_uuid();
  e_deadlift              UUID := gen_random_uuid();
  -- Full Body
  e_burpees               UUID := gen_random_uuid();
  -- Static Holds
  e_human_flag            UUID := gen_random_uuid();

BEGIN

-- ── EXERCISES ────────────────────────────────────────────────

INSERT INTO exercises (id, name, category, uses_regulated_weight, enabled) VALUES
  -- Push Bodyweight
  (e_normal_pushups,       'Normal Pushups',       'push_bodyweight', false, true),
  (e_diamond_pushups,      'Diamond Pushups',       'push_bodyweight', false, true),
  (e_archer_pushup,        'Archer Pushup',         'push_bodyweight', false, true),
  (e_single_arm_pushup,    'Single Arm Pushup',     'push_bodyweight', false, true),
  (e_finger_pushup,        'Finger Pushup',         'push_bodyweight', false, true),
  (e_planche_pushup,       'Planche Pushup',        'push_bodyweight', false, true),
  (e_handstand_pushup,     'Handstand Pushup',      'push_bodyweight', false, true),
  (e_90_degree_pushup,     '90 Degree Pushup',      'push_bodyweight', false, true),
  (e_plyometric_pushup,    'Plyometric Pushup',     'push_bodyweight', false, true),
  (e_clap_pushup,          'Clap Pushup',           'push_bodyweight', false, true),
  (e_tandem_pushup,        'Tandem Pushup',         'push_bodyweight', false, true),
  -- Push Equipment
  (e_bench_press,          'Bench Press',           'push_equipment',  false, true),
  (e_incline_bench_press,  'Incline Bench Press',   'push_equipment',  false, true),
  (e_overhead_press,       'Overhead Press',        'push_equipment',  false, true),
  (e_preacher_curl,        'Preacher Curl',         'push_equipment',  false, true),
  -- Pull Bodyweight
  (e_normal_pullups,       'Normal Pullups',        'pull_bodyweight', true,  true),
  (e_chest_to_bar_pullup,  'Chest to Bar Pullup',   'pull_bodyweight', false, true),
  (e_muscle_up,            'Muscle Up',             'pull_bodyweight', false, true),
  (e_single_arm_pullup,    'Single Arm Pullup',     'pull_bodyweight', false, true),
  (e_commando_pullup,      'Commando Pullup',       'pull_bodyweight', false, true),
  (e_chin_up,              'Chin Up',               'pull_bodyweight', false, true),
  (e_lsit_chin_up,         'L-Sit Chin Up',         'pull_bodyweight', false, true),
  -- Dips
  (e_parallel_bar_dips,    'Parallel Bar Dips',     'dips',            true,  true),
  (e_ring_dips,            'Ring Dips',             'dips',            false, true),
  (e_korean_dips,          'Korean Dips',           'dips',            false, true),
  (e_impossible_dips,      'Impossible Dips',       'dips',            false, true),
  -- Legs
  (e_squat,                'Squat',                 'legs',            false, true),
  (e_leg_extension,        'Leg Extension',         'legs',            false, true),
  (e_deadlift,             'Deadlift',              'legs',            false, true),
  -- Full Body
  (e_burpees,              'Burpees',               'full_body',       false, true),
  -- Static Holds
  (e_human_flag,           'Human Flag',            'static_holds',    false, true);

-- ── EXERCISE VARIATIONS ───────────────────────────────────────

INSERT INTO exercise_variations (id, exercise_id, name, format_type, time_limit_seconds, enabled) VALUES
  -- Normal Pushups
  (gen_random_uuid(), e_normal_pushups, 'Max Reps',             'max_reps',      NULL,  true),
  (gen_random_uuid(), e_normal_pushups, 'Max Reps in 60s',      'timed_reps',    60,    true),
  (gen_random_uuid(), e_normal_pushups, 'Max Reps in 10 min',   'timed_reps',    600,   true),
  (gen_random_uuid(), e_normal_pushups, 'Max Reps in 60 min',   'timed_reps',    3600,  true),

  -- Diamond Pushups
  (gen_random_uuid(), e_diamond_pushups, 'Max Reps',            'max_reps',      NULL,  true),
  (gen_random_uuid(), e_diamond_pushups, 'Max Reps in 60s',     'timed_reps',    60,    true),
  (gen_random_uuid(), e_diamond_pushups, 'Max Reps in 10 min',  'timed_reps',    600,   true),

  -- Archer Pushup
  (gen_random_uuid(), e_archer_pushup, 'Max Reps',              'max_reps',      NULL,  true),
  (gen_random_uuid(), e_archer_pushup, 'Max Reps in 60s',       'timed_reps',    60,    true),
  (gen_random_uuid(), e_archer_pushup, 'Max Reps in 10 min',    'timed_reps',    600,   true),

  -- Single Arm Pushup
  (gen_random_uuid(), e_single_arm_pushup, 'Max Reps',          'max_reps',      NULL,  true),
  (gen_random_uuid(), e_single_arm_pushup, 'Max Reps in 60s',   'timed_reps',    60,    true),

  -- Finger Pushup
  (gen_random_uuid(), e_finger_pushup, 'Max Reps',              'max_reps',      NULL,  true),
  (gen_random_uuid(), e_finger_pushup, 'Max Reps in 60s',       'timed_reps',    60,    true),

  -- Planche Pushup
  (gen_random_uuid(), e_planche_pushup, 'Max Reps',             'max_reps',      NULL,  true),
  (gen_random_uuid(), e_planche_pushup, 'Max Reps in 60s',      'timed_reps',    60,    true),
  (gen_random_uuid(), e_planche_pushup, 'Max Reps in 10 min',   'timed_reps',    600,   true),

  -- Handstand Pushup
  (gen_random_uuid(), e_handstand_pushup, 'Max Reps',           'max_reps',      NULL,  true),
  (gen_random_uuid(), e_handstand_pushup, 'Max Reps in 60s',    'timed_reps',    60,    true),

  -- 90 Degree Pushup
  (gen_random_uuid(), e_90_degree_pushup, 'Max Reps',           'max_reps',      NULL,  true),
  (gen_random_uuid(), e_90_degree_pushup, 'Max Reps in 60s',    'timed_reps',    60,    true),
  (gen_random_uuid(), e_90_degree_pushup, 'Max Reps in 10 min', 'timed_reps',    600,   true),

  -- Plyometric Pushup
  (gen_random_uuid(), e_plyometric_pushup, 'Max Reps in 60s',   'timed_reps',    60,    true),

  -- Clap Pushup
  (gen_random_uuid(), e_clap_pushup, 'Max Reps in 60s',         'timed_reps',    60,    true),

  -- Tandem Pushup
  (gen_random_uuid(), e_tandem_pushup, 'Max Reps',              'max_reps',      NULL,  true),

  -- Bench Press
  (gen_random_uuid(), e_bench_press, 'Max Weight',              'weight_based',  NULL,  true),

  -- Incline Bench Press
  (gen_random_uuid(), e_incline_bench_press, 'Max Weight',      'weight_based',  NULL,  true),

  -- Overhead Press
  (gen_random_uuid(), e_overhead_press, 'Max Weight',           'weight_based',  NULL,  true),

  -- Preacher Curl
  (gen_random_uuid(), e_preacher_curl, 'Max Weight',            'weight_based',  NULL,  true),

  -- Normal Pullups
  (gen_random_uuid(), e_normal_pullups, 'Max Reps',             'max_reps',      NULL,  true),
  (gen_random_uuid(), e_normal_pullups, 'Max Reps in 60s',      'timed_reps',    60,    true),
  (gen_random_uuid(), e_normal_pullups, 'Max Reps in 10 min',   'timed_reps',    600,   true),
  (gen_random_uuid(), e_normal_pullups, 'Max Reps in 60 min',   'timed_reps',    3600,  true),
  (gen_random_uuid(), e_normal_pullups, 'Weighted',             'max_reps',      NULL,  true),

  -- Chest to Bar Pullup
  (gen_random_uuid(), e_chest_to_bar_pullup, 'Max Reps',        'max_reps',      NULL,  true),
  (gen_random_uuid(), e_chest_to_bar_pullup, 'Max Reps in 60s', 'timed_reps',    60,    true),
  (gen_random_uuid(), e_chest_to_bar_pullup, 'Max Reps in 10 min','timed_reps',  600,   true),

  -- Muscle Up
  (gen_random_uuid(), e_muscle_up, 'Max Reps',                  'max_reps',      NULL,  true),
  (gen_random_uuid(), e_muscle_up, 'Max Reps in 60s',           'timed_reps',    60,    true),
  (gen_random_uuid(), e_muscle_up, 'Max Reps in 10 min',        'timed_reps',    600,   true),

  -- Single Arm Pullup
  (gen_random_uuid(), e_single_arm_pullup, 'Max Reps',          'max_reps',      NULL,  true),
  (gen_random_uuid(), e_single_arm_pullup, 'Max Reps in 60s',   'timed_reps',    60,    true),

  -- Commando Pullup
  (gen_random_uuid(), e_commando_pullup, 'Max Reps',            'max_reps',      NULL,  true),
  (gen_random_uuid(), e_commando_pullup, 'Max Reps in 60s',     'timed_reps',    60,    true),

  -- Chin Up
  (gen_random_uuid(), e_chin_up, 'Max Reps',                    'max_reps',      NULL,  true),
  (gen_random_uuid(), e_chin_up, 'Max Reps in 60s',             'timed_reps',    60,    true),
  (gen_random_uuid(), e_chin_up, 'Max Reps in 10 min',          'timed_reps',    600,   true),

  -- L-Sit Chin Up
  (gen_random_uuid(), e_lsit_chin_up, 'Max Reps',               'max_reps',      NULL,  true),
  (gen_random_uuid(), e_lsit_chin_up, 'Max Reps in 60s',        'timed_reps',    60,    true),

  -- Parallel Bar Dips
  (gen_random_uuid(), e_parallel_bar_dips, 'Max Reps',          'max_reps',      NULL,  true),
  (gen_random_uuid(), e_parallel_bar_dips, 'Max Reps in 60s',   'timed_reps',    60,    true),
  (gen_random_uuid(), e_parallel_bar_dips, 'Max Reps in 10 min','timed_reps',    600,   true),
  (gen_random_uuid(), e_parallel_bar_dips, 'Weighted',          'max_reps',      NULL,  true),

  -- Ring Dips
  (gen_random_uuid(), e_ring_dips, 'Max Reps',                  'max_reps',      NULL,  true),
  (gen_random_uuid(), e_ring_dips, 'Max Reps in 60s',           'timed_reps',    60,    true),

  -- Korean Dips
  (gen_random_uuid(), e_korean_dips, 'Max Reps',                'max_reps',      NULL,  true),
  (gen_random_uuid(), e_korean_dips, 'Max Reps in 60s',         'timed_reps',    60,    true),

  -- Impossible Dips
  (gen_random_uuid(), e_impossible_dips, 'Max Reps',            'max_reps',      NULL,  true),
  (gen_random_uuid(), e_impossible_dips, 'Max Reps in 60s',     'timed_reps',    60,    true),
  (gen_random_uuid(), e_impossible_dips, 'Max Reps in 10 min',  'timed_reps',    600,   true),

  -- Squat
  (gen_random_uuid(), e_squat, 'Max Weight',                    'weight_based',  NULL,  true),
  (gen_random_uuid(), e_squat, 'Bodyweight Max Reps in 60s',    'timed_reps',    60,    true),

  -- Leg Extension
  (gen_random_uuid(), e_leg_extension, 'Max Weight',            'weight_based',  NULL,  true),

  -- Deadlift
  (gen_random_uuid(), e_deadlift, 'Max Weight',                 'weight_based',  NULL,  true),

  -- Burpees
  (gen_random_uuid(), e_burpees, 'Max Reps in 60s',             'timed_reps',    60,    true),
  (gen_random_uuid(), e_burpees, 'Max Reps in 10 min',          'timed_reps',    600,   true),
  (gen_random_uuid(), e_burpees, 'Max Reps in 60 min',          'timed_reps',    3600,  true),

  -- Human Flag
  (gen_random_uuid(), e_human_flag, 'Max Hold Time',            'max_time_hold', NULL,  true);

END $$;
