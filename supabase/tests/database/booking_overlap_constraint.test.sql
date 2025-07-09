-- Test for booking overlap exclusion constraint
BEGIN;

-- Create test tables and data
SELECT plan(6);

-- Insert test users in auth.users first
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test1@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
), (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test2@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert test profiles
INSERT INTO profiles (user_id, name, name_hiragana, sex, date_of_birth, role)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Test User 1', 'てすと ゆーざー 1', 1, '1990-01-01', 'user'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Test User 2', 'てすと ゆーざー 2', 2, '1992-02-02', 'user');

-- Insert test service
INSERT INTO services (name, duration, price)
VALUES ('Test Service', 60, 5000);

-- Test 1: First booking should succeed
INSERT INTO bookings (profile_id, service_id, service_name, service_info, start_time, end_time, notes)
VALUES (
  (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'),
  (SELECT id FROM services WHERE name = 'Test Service'),
  'Test Service',
  '{"name": "Test Service", "duration": 60, "price": 5000}',
  '2025-07-10 10:00:00+09:00',
  '2025-07-10 11:00:00+09:00',
  'Test booking 1'
);

SELECT ok(TRUE, 'First booking inserted successfully');

-- Test 2: Overlapping booking should fail
SELECT throws_ok(
  'INSERT INTO bookings (profile_id, service_id, service_name, service_info, start_time, end_time, notes) VALUES (
    (SELECT id FROM profiles WHERE user_id = ''550e8400-e29b-41d4-a716-446655440002''),
    (SELECT id FROM services WHERE name = ''Test Service''),
    ''Test Service'',
    ''{"name": "Test Service", "duration": 60, "price": 5000}'',
    ''2025-07-10 10:30:00+09:00'',
    ''2025-07-10 11:30:00+09:00'',
    ''Test booking 2''
  )',
  '23P01'
);

-- Test 3: Non-overlapping booking should succeed
INSERT INTO bookings (profile_id, service_id, service_name, service_info, start_time, end_time, notes)
VALUES (
  (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'),
  (SELECT id FROM services WHERE name = 'Test Service'),
  'Test Service',
  '{"name": "Test Service", "duration": 60, "price": 5000}',
  '2025-07-10 11:00:00+09:00',
  '2025-07-10 12:00:00+09:00',
  'Test booking 3'
);

SELECT ok(TRUE, 'Non-overlapping booking inserted successfully');

-- Test 4: Logically deleted booking should not interfere
-- First, soft delete the first booking
UPDATE bookings 
SET deleted_at = NOW() 
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001');

-- Now overlapping booking should succeed (because first booking is soft deleted)
INSERT INTO bookings (profile_id, service_id, service_name, service_info, start_time, end_time, notes)
VALUES (
  (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'),
  (SELECT id FROM services WHERE name = 'Test Service'),
  'Test Service',
  '{"name": "Test Service", "duration": 60, "price": 5000}',
  '2025-07-10 09:30:00+09:00',
  '2025-07-10 10:30:00+09:00',
  'Test booking 4'
);

SELECT ok(TRUE, 'Booking overlapping with soft-deleted booking should succeed');

-- Test 5: Adjacent bookings should be allowed
INSERT INTO bookings (profile_id, service_id, service_name, service_info, start_time, end_time, notes)
VALUES (
  (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'),
  (SELECT id FROM services WHERE name = 'Test Service'),
  'Test Service',
  '{"name": "Test Service", "duration": 60, "price": 5000}',
  '2025-07-10 12:00:00+09:00',
  '2025-07-10 13:00:00+09:00',
  'Test booking 5'
);

SELECT ok(TRUE, 'Adjacent bookings should be allowed');

-- Test 6: Verify constraint name exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'bookings' 
    AND c.conname = 'no_overlapping_active_bookings'
    AND c.contype = 'x'
  ),
  'Exclusion constraint exists'
);

SELECT * FROM finish();
ROLLBACK;