-- bookings_rls.test.sql
-- bookingsテーブルのRLS（行レベルセキュリティ）機能テスト

BEGIN;
SELECT plan(10);

-- テスト用のユーザーIDを作成
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

-- テスト用のプロフィールを作成
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'テストユーザー1',
    'てすとゆーざー1',
    1,
    '1990-01-01'
), (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'テストユーザー2',
    'てすとゆーざー2',
    2,
    '1991-02-02'
);

-- テスト用サービスを作成
INSERT INTO services (name, duration, price) VALUES 
    ('ヘアカット', 60, 3000),
    ('ネイルケア', 90, 5000);

-- =============================================================================
-- テーブル構造テスト
-- =============================================================================

-- テスト1: bookingsテーブルが存在する
SELECT ok(
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'bookings'),
    'bookingsテーブルが存在する'
);

-- テスト2: RLSが有効である
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'bookings'),
    'bookingsテーブルでRLSが有効'
);

-- =============================================================================
-- 基本的なCRUD操作テスト
-- =============================================================================

-- テスト3: 認証されたユーザーは予約を作成できない（INSERTポリシーが削除されているため）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

-- DO ブロックでエラーをキャッチ
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO bookings (
            profile_id,
            service_id,
            service_name,
            service_info,
            notes,
            start_time,
            end_time
        ) VALUES (
            (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
            (SELECT id FROM services WHERE name = 'ヘアカット'),
            'ヘアカット',
            '{"name": "ヘアカット", "duration": 60, "price": 3000}'::jsonb,
            'カットとシャンプーお願いします',
            '2024-01-01 10:00:00',
            '2024-01-01 11:00:00'
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            insert_successful := FALSE;
    END;
    
    CREATE TEMP TABLE IF NOT EXISTS test_results (
        test_name TEXT,
        result BOOLEAN
    );
    
    INSERT INTO test_results VALUES ('booking_insert_test', NOT insert_successful);
END $$;

SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'booking_insert_test'),
    '認証されたユーザーは予約を作成できない（INSERTポリシーが削除されているため）'
);

-- テスト4: サービスロールで予約を作成（テストデータとして）
RESET role;
INSERT INTO bookings (
    profile_id,
    service_id,
    service_name,
    service_info,
    notes,
    start_time,
    end_time
) VALUES (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    (SELECT id FROM services WHERE name = 'ヘアカット'),
    'ヘアカット',
    '{"name": "ヘアカット", "duration": 60, "price": 3000}'::jsonb,
    'カットとシャンプーお願いします',
    '2024-01-01 10:00:00',
    '2024-01-01 11:00:00'
);

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    1,
    'サービスロールで予約を作成可能'
);

-- テスト5: 認証されたユーザーが自分の予約を読み取れる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT service_name FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    'ヘアカット',
    '認証されたユーザーが自分の予約を読み取れる'
);

-- テスト6: サービスロールでuser2のプロフィールに予約を作成
RESET role;
INSERT INTO bookings (
    profile_id,
    service_id,
    service_name,
    service_info,
    notes,
    start_time,
    end_time
) VALUES (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    (SELECT id FROM services WHERE name = 'ネイルケア'),
    'ネイルケア',
    '{"name": "ネイルケア", "duration": 90, "price": 5000}'::jsonb,
    'ジェルネイルお願いします',
    '2024-01-01 14:00:00',
    '2024-01-01 15:00:00'
);

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    2,
    'サービスロールで全ての予約を作成可能'
);

-- テスト7: 認証されたユーザーが自分の予約のみを読み取れる（user1視点）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    1,
    '認証されたユーザーが自分の予約のみを読み取れる（user1）'
);

-- テスト8: 認証されたユーザーが自分の予約のみを読み取れる（user2視点）
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    1,
    '認証されたユーザーが自分の予約のみを読み取れる（user2）'
);

-- =============================================================================
-- 論理削除テスト
-- =============================================================================

-- テスト9: サービスロールで論理削除
RESET role;
UPDATE bookings 
SET deleted_at = NOW()
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid);

SELECT isnt(
    (SELECT deleted_at FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    NULL,
    'サービスロールで論理削除可能'
);

-- テスト10: 論理削除後、認証ユーザーから見えない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    0,
    '論理削除後、認証ユーザーから見えない'
);

-- =============================================================================
-- クリーンアップ
-- =============================================================================

RESET role;
DELETE FROM bookings WHERE profile_id IN (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
);
DELETE FROM services WHERE name IN ('ヘアカット', 'ネイルケア');
DELETE FROM profiles WHERE user_id IN (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, 
    '550e8400-e29b-41d4-a716-446655440002'::uuid
);
DELETE FROM auth.users WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, 
    '550e8400-e29b-41d4-a716-446655440002'::uuid
);

SELECT finish();
ROLLBACK;