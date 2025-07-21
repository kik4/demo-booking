-- bookings_rls.test.sql
-- bookingsテーブルのRLS（行レベルセキュリティ）機能テスト

BEGIN;
SELECT plan(15);

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
-- deleted_by_profile_id カラムテスト
-- =============================================================================

-- テスト11: サービスロールでdeleted_by_profile_idを設定して予約作成
RESET role;
INSERT INTO bookings (
    profile_id,
    service_id,
    service_name,
    service_info,
    notes,
    start_time,
    end_time,
    deleted_by_profile_id
) VALUES (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    (SELECT id FROM services WHERE name = 'ネイルケア'),
    'ネイルケア追加',
    '{"name": "ネイルケア", "duration": 90, "price": 5000}'::jsonb,
    'deleted_by_profile_idテスト用予約',
    '2024-01-02 10:00:00',
    '2024-01-02 11:30:00',
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)
);

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE deleted_by_profile_id IS NOT NULL),
    1,
    'サービスロールでdeleted_by_profile_id設定済み予約を作成可能'
);

-- テスト12: ユーザーがdeleted_by_profile_idカラムにアクセス可能
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT ok(
    (SELECT deleted_by_profile_id IS NOT NULL FROM bookings 
     WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
     AND notes = 'deleted_by_profile_idテスト用予約'),
    'ユーザーがdeleted_by_profile_idカラムにアクセス可能'
);

-- テスト13: deleted_by_profile_idが設定されていても通常の予約として表示される
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    2,
    'deleted_by_profile_idが設定されていても通常の予約として表示される（deleted_atがNULLの場合）'
);

-- テスト14: サービスロールでdeleted_by_profile_idを更新
RESET role;
UPDATE bookings 
SET deleted_by_profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
  AND deleted_by_profile_id IS NOT NULL;

SELECT is(
    (SELECT COUNT(*)::int FROM bookings 
     WHERE deleted_by_profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    1,
    'サービスロールでdeleted_by_profile_idを更新可能'
);

-- テスト15: 論理削除時にdeleted_by_profile_idも設定
UPDATE bookings 
SET deleted_at = NOW(),
    deleted_by_profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
  AND notes = 'ジェルネイルお願いします';

-- 論理削除後、ユーザーから見えない（deleted_by_profile_idが設定されていても）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    1,
    '論理削除後はdeleted_by_profile_idが設定されていてもユーザーから見えない'
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