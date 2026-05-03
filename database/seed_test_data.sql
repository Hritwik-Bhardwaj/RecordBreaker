-- =============================================================
-- RecordBreaker — Test Data Seed (plain SQL, no DO block)
-- Run AFTER schema.sql and seed_exercises.sql
-- Safe to run multiple times — users use ON CONFLICT DO NOTHING
-- =============================================================

INSERT INTO users (name, email, password_hash, date_of_birth, gender, body_weight_kg, weight_class, state, country) VALUES
  ('Arjun Sharma',  'arjun@test.com',   'hash', '1994-03-15', 'men',   62.5,  'lightweight',       'Maharashtra', 'IN'),
  ('Rohit Verma',   'rohit@test.com',   'hash', '1992-07-22', 'men',   74.0,  'middleweight',      'Karnataka',   'IN'),
  ('Karan Singh',   'karan@test.com',   'hash', '1996-11-05', 'men',   71.5,  'middleweight',      'Delhi',       'IN'),
  ('Vikram Nair',   'vikram@test.com',  'hash', '1990-01-30', 'men',   88.0,  'light_heavyweight', 'Tamil Nadu',  'IN'),
  ('Suresh Patel',  'suresh@test.com',  'hash', '1993-06-18', 'men',   102.0, 'heavyweight',       'Punjab',      'IN'),
  ('Dev Malhotra',  'dev@test.com',     'hash', '2005-09-12', 'men',   68.0,  'middleweight',      'Maharashtra', 'IN'),
  ('Nikhil Gupta',  'nikhil@test.com',  'hash', '2004-04-20', 'men',   60.0,  'lightweight',       'Rajasthan',   'IN'),
  ('Anil Joshi',    'anil@test.com',    'hash', '1984-02-08', 'men',   77.0,  'middleweight',      'Karnataka',   'IN'),
  ('Ramesh Iyer',   'ramesh@test.com',  'hash', '1972-10-25', 'men',   70.0,  'middleweight',      'Kerala',      'IN'),
  ('James Wilson',  'james@test.com',   'hash', '1991-05-14', 'men',   75.0,  'middleweight',      'California',  'US'),
  ('Chris Taylor',  'chris@test.com',   'hash', '1993-08-30', 'men',   83.0,  'light_heavyweight', 'Texas',       'US'),
  ('Oliver Smith',  'oliver@test.com',  'hash', '1989-12-01', 'men',   72.0,  'middleweight',      'London',      'GB'),
  ('Priya Desai',   'priya@test.com',   'hash', '1995-03-22', 'women', 52.0,  'lightweight',       'Maharashtra', 'IN'),
  ('Ananya Reddy',  'ananya@test.com',  'hash', '1993-07-10', 'women', 62.0,  'middleweight',      'Telangana',   'IN'),
  ('Sneha Pillai',  'sneha@test.com',   'hash', '1990-11-28', 'women', 74.0,  'light_heavyweight', 'Kerala',      'IN'),
  ('Kavita Mehta',  'kavita@test.com',  'hash', '1996-01-05', 'women', 88.0,  'heavyweight',       'Gujarat',     'IN'),
  ('Lakshmi Rao',   'lakshmi@test.com', 'hash', '2004-06-14', 'women', 50.0,  'lightweight',       'Karnataka',   'IN'),
  ('Meera Nair',    'meera@test.com',   'hash', '1985-09-03', 'women', 60.0,  'middleweight',      'Tamil Nadu',  'IN'),
  ('Sarah Johnson', 'sarah@test.com',   'hash', '1992-04-17', 'women', 58.0,  'middleweight',      'New York',    'US'),
  ('Emma Davis',    'emma@test.com',    'hash', '1991-08-25', 'women', 65.0,  'light_heavyweight', 'Manchester',  'GB')
ON CONFLICT (email) DO NOTHING;

-- Records — inline subqueries resolve user_id and variation_id
INSERT INTO records (user_id, variation_id, gender, age_bracket, weight_class, country, state, value_reps, status, video_url, approved_at) VALUES

  -- Men / Main / Middleweight — India
  ((SELECT id FROM users WHERE email='rohit@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','IN','Karnataka', 35,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'180 days'),
  ((SELECT id FROM users WHERE email='karan@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','IN','Delhi',     28,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'150 days'),
  ((SELECT id FROM users WHERE email='rohit@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','IN','Karnataka', 42,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'90 days'),
  ((SELECT id FROM users WHERE email='karan@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','IN','Delhi',     31,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'60 days'),

  -- Men / Main / Middleweight — Global (US + GB)
  ((SELECT id FROM users WHERE email='james@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','US','California',45,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'200 days'),
  ((SELECT id FROM users WHERE email='oliver@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','middleweight','GB','London',    38,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'120 days'),

  -- Men / Junior / Middleweight
  ((SELECT id FROM users WHERE email='dev@test.com'),    (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','junior','middleweight','IN','Maharashtra',22,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'40 days'),

  -- Men / Junior / Lightweight
  ((SELECT id FROM users WHERE email='nikhil@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','junior','lightweight','IN','Rajasthan',  18,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'30 days'),

  -- Men / Main / Lightweight
  ((SELECT id FROM users WHERE email='arjun@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','lightweight','IN','Maharashtra', 27,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'100 days'),
  ((SELECT id FROM users WHERE email='arjun@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','lightweight','IN','Maharashtra', 33,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'20 days'),

  -- Men / Main / Light Heavyweight
  ((SELECT id FROM users WHERE email='vikram@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','light_heavyweight','IN','Tamil Nadu',19,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'80 days'),
  ((SELECT id FROM users WHERE email='chris@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','light_heavyweight','US','Texas',     24,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'50 days'),

  -- Men / Main / Heavyweight
  ((SELECT id FROM users WHERE email='suresh@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','main','heavyweight','IN','Punjab',       12,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'110 days'),

  -- Men / Senior / Middleweight
  ((SELECT id FROM users WHERE email='anil@test.com'),   (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','senior','middleweight','IN','Karnataka',  25,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'70 days'),

  -- Men / Senior I / Middleweight
  ((SELECT id FROM users WHERE email='ramesh@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'men','senior_i','middleweight','IN','Kerala',    15,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'45 days'),

  -- Women / Main / Middleweight
  ((SELECT id FROM users WHERE email='ananya@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','middleweight','IN','Telangana',  18,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'130 days'),
  ((SELECT id FROM users WHERE email='meera@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','middleweight','IN','Tamil Nadu', 14,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'55 days'),
  ((SELECT id FROM users WHERE email='sarah@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','middleweight','US','New York',   22,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'95 days'),

  -- Women / Main / Lightweight
  ((SELECT id FROM users WHERE email='priya@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','lightweight','IN','Maharashtra', 16,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'85 days'),

  -- Women / Junior / Lightweight
  ((SELECT id FROM users WHERE email='lakshmi@test.com'),(SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','junior','lightweight','IN','Karnataka',  11,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'25 days'),

  -- Women / Main / Light Heavyweight
  ((SELECT id FROM users WHERE email='sneha@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','light_heavyweight','IN','Kerala',  13,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'65 days'),
  ((SELECT id FROM users WHERE email='emma@test.com'),   (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','light_heavyweight','GB','Manchester',17,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'35 days'),

  -- Women / Main / Heavyweight
  ((SELECT id FROM users WHERE email='kavita@test.com'), (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','main','heavyweight','IN','Gujarat',      9,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'75 days'),

  -- Women / Senior / Middleweight
  ((SELECT id FROM users WHERE email='meera@test.com'),  (SELECT ev.id FROM exercise_variations ev JOIN exercises e ON e.id=ev.exercise_id WHERE e.name='Normal Pullups' AND ev.name='Max Reps' LIMIT 1), 'women','senior','middleweight','IN','Tamil Nadu', 10,'approved','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', now()-interval'140 days');
