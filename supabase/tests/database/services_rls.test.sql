-- services_rls_test.sql
-- サービステーブルのRLS（行レベルセキュリティ）機能テスト

BEGIN;
SELECT plan(16);

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
    'user1@example.com',
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
    'admin_test@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- プロフィールを作成
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'テストユーザー',
    'てすとゆーざー',
    1,
    '1990-01-01',
    'user'
), (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'テスト管理者',
    'てすとかんりしゃ',
    1,
    '1985-01-01',
    'admin'
);

-- =============================================================================
-- テーブル構造テスト
-- =============================================================================

-- テスト1: servicesテーブルが存在する
SELECT ok(
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'services'),
    'servicesテーブルが存在する'
);

-- テスト2: RLSが有効である
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'services'),
    'servicesテーブルでRLSが有効'
);

-- =============================================================================
-- RLSポリシー存在確認
-- =============================================================================

-- テスト3: selectポリシーが存在する
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'SELECT' 
        AND policyname = 'services_select_policy'
    ),
    'selectポリシーが存在する'
);

-- テスト4: insertポリシーが存在する
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'INSERT' 
        AND policyname = 'services_admin_insert_policy'
    ),
    'insertポリシーが存在する'
);

-- テスト5: updateポリシーが存在する
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'UPDATE' 
        AND policyname = 'services_admin_update_policy'
    ),
    'updateポリシーが存在する'
);

-- 注意: DELETE ポリシーは削除されました（管理者でも物理削除は制限）

-- =============================================================================
-- サービスロールでのデータ準備
-- =============================================================================

-- サービスロールでテストデータを作成
RESET role;
INSERT INTO services (name, duration, price) VALUES ('テストサービス1', 60, 3000);
INSERT INTO services (name, duration, price) VALUES ('テストサービス2', 90, 5000);
INSERT INTO services (name, duration, price) VALUES ('削除予定サービス', 30, 1000);

-- 1つのサービスを削除状態にする
UPDATE services SET deleted_at = NOW() WHERE name = '削除予定サービス';

-- テスト6: サービスロールで全データ読み取り可能
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テストサービス%' OR name = '削除予定サービス'),
    3,
    'サービスロールで全サービス読み取り可能'
);

-- =============================================================================
-- 匿名ユーザーのアクセステスト
-- =============================================================================

-- テスト7: 匿名ユーザーでアクティブサービス読み取り
SET LOCAL role anon;
RESET request.jwt.claims;

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テストサービス%'),
    2,
    '匿名ユーザーでアクティブサービス読み取り可能'
);

-- テスト8: 匿名ユーザーは削除されたサービスは見えない
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = '削除予定サービス'),
    0,
    '匿名ユーザーは削除されたサービスは見えない'
);

-- =============================================================================
-- 通常ユーザーのアクセステスト
-- =============================================================================

-- テスト9: 通常ユーザーでアクティブサービス読み取り
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テストサービス%'),
    2,
    '通常ユーザーでアクティブサービス読み取り可能'
);

-- テスト10: 通常ユーザーは削除されたサービスは見えない
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = '削除予定サービス'),
    0,
    '通常ユーザーは削除されたサービスは見えない'
);

-- =============================================================================
-- 管理者ユーザーのアクセステスト
-- =============================================================================

-- テスト11: 管理者ユーザーでアクティブサービス読み取り
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テストサービス%'),
    2,
    '管理者ユーザーでアクティブサービス読み取り可能'
);

-- テスト12: 管理者ユーザーはサービス作成可能
INSERT INTO services (name, duration, price) VALUES ('管理者作成', 120, 8000);

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = '管理者作成'),
    1,
    '管理者ユーザーはサービス作成可能'
);

-- テスト13: 管理者ユーザーはサービス更新可能
UPDATE services SET price = 9000 WHERE name = '管理者作成';

SELECT is(
    (SELECT price FROM services WHERE name = '管理者作成'),
    9000,
    '管理者ユーザーはサービス更新可能'
);

-- =============================================================================
-- 論理削除テスト
-- =============================================================================

-- テスト14: サービスロールで論理削除
RESET role;
UPDATE services SET deleted_at = NOW() WHERE name = 'テストサービス1';

SELECT isnt(
    (SELECT deleted_at FROM services WHERE name = 'テストサービス1'),
    NULL,
    'サービスロールで論理削除可能'
);

-- テスト15: 論理削除後、通常ユーザーから見えない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テストサービス1'),
    0,
    '論理削除後、通常ユーザーから見えない'
);

-- テスト16: 論理削除後、管理者からは見える（新しいRLSポリシー）
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テストサービス1'),
    1,
    '論理削除後、管理者からは見える'
);

-- =============================================================================
-- クリーンアップ
-- =============================================================================

RESET role;
DELETE FROM services WHERE name LIKE 'テスト%' OR name LIKE '管理者%' OR name LIKE '削除予定%';
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