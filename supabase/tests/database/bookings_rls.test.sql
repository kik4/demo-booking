-- bookings_rls.test.sql
-- bookingsテーブルのRLS（行レベルセキュリティ）機能の包括的なpgTAPテスト

BEGIN;
SELECT plan(25);

-- テスト用のユーザーIDを作成（実際のUUID形式）
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

-- プロフィールIDを直接取得して使用するため、変数は使わない

-- =============================================================================
-- bookingの作成と読み取りテスト
-- =============================================================================

-- テスト1: 認証されたユーザーが自分のプロフィールで予約を作成できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

INSERT INTO bookings (
    profile_id,
    service_name,
    notes,
    start_time,
    end_time
) VALUES (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    'ヘアカット',
    'カットとシャンプーお願いします',
    '2024-01-01 10:00:00',
    '2024-01-01 11:00:00'
);

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    1,
    '認証されたユーザーが自分のプロフィールで予約を作成できる'
);

-- テスト2: 認証されたユーザーが自分の予約を読み取れる
SELECT is(
    (SELECT service_name FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    'ヘアカット',
    '認証されたユーザーが自分の予約を読み取れる'
);

-- サービスロールでuser2のプロフィールに予約を作成
RESET role;
INSERT INTO bookings (
    profile_id,
    service_name,
    notes,
    start_time,
    end_time
) VALUES (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    'ネイルケア',
    'ジェルネイルお願いします',
    '2024-01-01 14:00:00',
    '2024-01-01 15:00:00'
);

-- テスト3: 認証されたユーザーが自分の予約のみを読み取れる（user1視点）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    1,
    '認証されたユーザーが自分の予約のみを読み取れる（user1）'
);

-- テスト4: 認証されたユーザーが自分の予約のみを読み取れる（user2視点）
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    1,
    '認証されたユーザーが自分の予約のみを読み取れる（user2）'
);

SELECT is(
    (SELECT service_name FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    'ネイルケア',
    'user2が自分の予約を正しく読み取れる'
);

-- テスト5: 認証されたユーザーが他のユーザーの予約を直接取得できない
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    0,
    '認証されたユーザーが他のユーザーの予約を直接取得できない'
);

-- テスト6: サービスロールクライアントは全ての予約にアクセスできる
RESET role;

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id IN ((SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid), (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid))),
    2,
    'サービスロールクライアントは全ての予約にアクセスできる'
);

-- テスト7: 認証されたユーザーが自分の予約のみを更新できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

UPDATE bookings 
SET notes = 'カットとシャンプーとトリートメントお願いします'
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid);

SELECT is(
    (SELECT notes FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    'カットとシャンプーとトリートメントお願いします',
    '認証されたユーザーが自分の予約を更新できる'
);

-- テスト8: 認証されたユーザーが他のユーザーの予約を更新できない
UPDATE bookings 
SET notes = '勝手に変更してみる'
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid);

-- user2の予約が変更されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT notes FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    'ジェルネイルお願いします',
    '認証されたユーザーが他のユーザーの予約を更新できない'
);

-- テスト9: 認証されたユーザーが他のユーザーのプロフィールで予約を作成できない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

-- DO ブロックでエラーをキャッチしてテストの継続を可能にする
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO bookings (
            profile_id,
            service_name,
            notes,
            start_time,
            end_time
        ) VALUES (
            (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
            '不正な予約',
            '他人のプロフィールで予約',
            '2024-01-01 16:00:00',
            '2024-01-01 17:00:00'
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            -- RLSポリシー違反は期待される動作
            insert_successful := FALSE;
    END;
    
    -- テスト結果を一時テーブルに保存
    CREATE TEMP TABLE IF NOT EXISTS test_results (
        test_name TEXT,
        result BOOLEAN
    );
    
    INSERT INTO test_results VALUES ('cross_profile_insert_test', NOT insert_successful);
END $$;

-- 作成されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE service_name = '不正な予約'),
    0,
    '認証されたユーザーが他のユーザーのプロフィールで予約を作成できない'
);

-- =============================================================================
-- 削除された予約の読み取りテスト（soft delete）
-- =============================================================================

-- テスト10: 予約をsoft deleteする（サービスロールで実行）
-- 認証ユーザーでのsoft deleteはRLSで制限されているため、サービスロールで実行
RESET role;
UPDATE bookings 
SET deleted_at = NOW()
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid);

-- テスト11: 削除された予約は読み取れない（認証ユーザーに戻す）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    0,
    '削除された予約は読み取れない'
);

-- テスト12: サービスロールでは削除された予約も読み取れる
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    1,
    'サービスロールでは削除された予約も読み取れる'
);

-- テスト13: 削除された予約は更新できない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

UPDATE bookings 
SET notes = '削除済みの予約を更新してみる'
WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid);

-- サービスロールで更新されていないことを確認
RESET role;
SELECT is(
    (SELECT notes FROM bookings WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid)),
    'カットとシャンプーとトリートメントお願いします',
    '削除された予約は更新できない'
);

-- =============================================================================
-- RLSポリシーの動作確認テスト
-- =============================================================================

-- テスト14: 未認証ユーザー（anon）は予約を読み取れない
SET LOCAL role anon;
RESET request.jwt.claims;

SELECT is(
    (SELECT COUNT(*)::int FROM bookings),
    0,
    '未認証ユーザーは予約を読み取れない'
);

-- テスト15: RLSが有効になっていることを確認
RESET role;
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'bookings'),
    'bookingsテーブルでRLSが有効になっている'
);

-- テスト16: selectポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND cmd = 'SELECT' 
        AND policyname = 'Enable users to view their own bookings'
    ),
    'selectポリシーが存在する'
);

-- テスト17: insertポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND cmd = 'INSERT' 
        AND policyname = 'Enable insert for users based on profile ownership'
    ),
    'insertポリシーが存在する'
);

-- テスト18: updateポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND cmd = 'UPDATE' 
        AND policyname = 'Enable users to update their own bookings'
    ),
    'updateポリシーが存在する'
);

-- テスト19: foreign key制約が存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_profile_id_fkey'
    ),
    'profile_idのforeign key制約が存在する'
);

-- テスト20: time range制約が存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_time_range_valid'
    ),
    'end_time > start_time制約が存在する'
);

-- テスト21: profile_idのインデックスが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'bookings' 
        AND indexname = 'idx_bookings_profile_id'
    ),
    'profile_idのインデックスが存在する'
);

-- =============================================================================
-- 制約テスト
-- =============================================================================

-- テスト22: end_time > start_time制約のテスト
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

-- DO ブロックでエラーをキャッチしてテストの継続を可能にする
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO bookings (
            profile_id,
            service_name,
            notes,
            start_time,
            end_time
        ) VALUES (
            (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
            '無効な時間範囲',
            'テスト用',
            '2024-01-01 12:00:00',
            '2024-01-01 11:00:00'  -- start_timeより前
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN check_violation THEN
            -- 制約違反は期待される動作
            insert_successful := FALSE;
    END;
    
    INSERT INTO test_results VALUES ('time_range_constraint_test', NOT insert_successful);
END $$;

-- 作成されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE service_name = '無効な時間範囲'),
    0,
    'end_time > start_time制約により無効な時間範囲は拒否される'
);

-- テスト23: 存在しないprofile_idでの予約作成テスト
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

-- DO ブロックでエラーをキャッチしてテストの継続を可能にする
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO bookings (
            profile_id,
            service_name,
            notes,
            start_time,
            end_time
        ) VALUES (
            99999,  -- 存在しないprofile_id
            '存在しないプロフィール',
            'テスト用',
            '2024-01-01 10:00:00',
            '2024-01-01 11:00:00'
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN foreign_key_violation OR insufficient_privilege THEN
            -- 外部キー制約違反またはRLS違反は期待される動作
            insert_successful := FALSE;
    END;
    
    INSERT INTO test_results VALUES ('invalid_profile_id_test', NOT insert_successful);
END $$;

-- 作成されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE service_name = '存在しないプロフィール'),
    0,
    '存在しないprofile_idでの予約作成は拒否される'
);

-- DO ブロックの結果も確認
SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'invalid_profile_id_test'),
    '存在しないprofile_idでのINSERTが適切に拒否される'
);

-- テスト24: 削除されたプロフィールでの予約作成テスト
-- まず、プロフィールIDを保存してから削除
DO $$
DECLARE
    deleted_profile_id bigint;
BEGIN
    SELECT id INTO deleted_profile_id 
    FROM profiles 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;
    
    -- プロフィールを削除
    UPDATE profiles 
    SET deleted_at = NOW()
    WHERE id = deleted_profile_id;
    
    -- 一時テーブルにIDを保存
    CREATE TEMP TABLE IF NOT EXISTS deleted_profile_info (profile_id bigint);
    INSERT INTO deleted_profile_info VALUES (deleted_profile_id);
END $$;

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

-- DO ブロックでエラーをキャッチしてテストの継続を可能にする
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO bookings (
            profile_id,
            service_name,
            notes,
            start_time,
            end_time
        ) VALUES (
            (SELECT profile_id FROM deleted_profile_info),
            '削除されたプロフィールでの予約',
            'テスト用',
            '2024-01-01 10:00:00',
            '2024-01-01 11:00:00'
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            -- RLSポリシー違反は期待される動作
            insert_successful := FALSE;
    END;
    
    INSERT INTO test_results VALUES ('deleted_profile_booking_test', NOT insert_successful);
END $$;

-- 作成されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM bookings WHERE service_name = '削除されたプロフィールでの予約'),
    0,
    '削除されたプロフィールでの予約作成は拒否される'
);

-- =============================================================================
-- クリーンアップ
-- =============================================================================

-- テストデータを削除
RESET role;
DELETE FROM bookings WHERE profile_id IN (
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    (SELECT id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid)
);

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