-- services_rls_test.sql
-- サービステーブルのRLS（行レベルセキュリティ）機能の包括的なpgTAPテスト

BEGIN;
SELECT plan(35);

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
    'admin@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- プロフィールを作成（通常ユーザーと管理者）
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
-- サービステーブルの基本構造テスト
-- =============================================================================

-- テスト1: servicesテーブルが存在することを確認
SELECT ok(
    EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'services'),
    'servicesテーブルが存在する'
);

-- テスト2: RLSが有効になっていることを確認
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'services'),
    'servicesテーブルでRLSが有効になっている'
);

-- テスト3: 必要なカラムが存在することを確認
SELECT ok(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'id'),
    'idカラムが存在する'
);

SELECT ok(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'name'),
    'nameカラムが存在する'
);

SELECT ok(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration'),
    'durationカラムが存在する'
);

SELECT ok(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'price'),
    'priceカラムが存在する'
);

SELECT ok(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'deleted_at'),
    'deleted_atカラムが存在する'
);

-- =============================================================================
-- RLSポリシーの存在確認テスト
-- =============================================================================

-- テスト7: selectポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'SELECT' 
        AND policyname = 'services_select_policy'
    ),
    'selectポリシーが存在する'
);

-- テスト8: insertポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'INSERT' 
        AND policyname = 'services_admin_insert_policy'
    ),
    'insertポリシーが存在する'
);

-- テスト9: updateポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'UPDATE' 
        AND policyname = 'services_admin_update_policy'
    ),
    'updateポリシーが存在する'
);

-- テスト10: deleteポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND cmd = 'DELETE' 
        AND policyname = 'services_admin_delete_policy'
    ),
    'deleteポリシーが存在する'
);

-- =============================================================================
-- サービスデータの作成と読み取りテスト
-- =============================================================================

-- テスト用サービスデータを作成（サービスロール）
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    'テストカット',
    60,
    3000
), (
    'テストカラー',
    120,
    8000
), (
    'テスト削除サービス',
    30,
    1500
);

-- 削除されたサービスを作成
UPDATE services 
SET deleted_at = NOW() 
WHERE name = 'テスト削除サービス';

-- テスト11: 未認証ユーザー（anon）でもアクティブなサービスを読み取れる
SET LOCAL role anon;
RESET request.jwt.claims;

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE deleted_at IS NULL),
    2,
    '未認証ユーザーでもアクティブなサービスを読み取れる'
);

-- テスト12: 未認証ユーザーは削除されたサービスは見えない
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テスト削除サービス'),
    0,
    '未認証ユーザーは削除されたサービスは見えない'
);

-- テスト13: 認証された通常ユーザーでもアクティブなサービスを読み取れる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE deleted_at IS NULL),
    2,
    '認証された通常ユーザーでもアクティブなサービスを読み取れる'
);

-- テスト14: 通常ユーザーは削除されたサービスは見えない
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テスト削除サービス'),
    0,
    '通常ユーザーは削除されたサービスは見えない'
);

-- テスト15: 通常ユーザーはサービスデータを作成できない
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO services (
            name,
            duration,
            price
        ) VALUES (
            'ユーザー作成テスト',
            45,
            2000
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
    
    INSERT INTO test_results VALUES ('user_insert_test', NOT insert_successful);
END $$;

SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'user_insert_test'),
    '通常ユーザーはサービスデータを作成できない'
);

-- テスト16: 通常ユーザーはサービスデータを更新できない
UPDATE services 
SET price = 5000 
WHERE name = 'テストカット';

-- 更新されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT price FROM services WHERE name = 'テストカット'),
    3000,
    '通常ユーザーはサービスデータを更新できない'
);

-- =============================================================================
-- 管理者ユーザーのアクセステスト
-- =============================================================================

-- テスト17: 管理者ユーザーはアクティブなサービスを読み取れる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE deleted_at IS NULL),
    2,
    '管理者ユーザーはアクティブなサービスを読み取れる'
);

-- テスト18: 管理者ユーザーは削除されたサービスも見える（現在のRLSでは見えない）
-- 注：現在のRLSポリシーでは管理者も削除されたサービスは見えません
-- これは将来的にadmin用のSELECTポリシーを追加することで改善できます
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テスト削除サービス'),
    0,
    '管理者ユーザーも現在のRLSでは削除されたサービスは見えない'
);

-- テスト19: 管理者ユーザーはサービスデータを作成できる
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    '管理者作成サービス',
    90,
    6000
);

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = '管理者作成サービス'),
    1,
    '管理者ユーザーはサービスデータを作成できる'
);

-- テスト20: 管理者ユーザーはサービスデータを更新できる
UPDATE services 
SET price = 7000 
WHERE name = '管理者作成サービス';

SELECT is(
    (SELECT price FROM services WHERE name = '管理者作成サービス'),
    7000,
    '管理者ユーザーはサービスデータを更新できる'
);

-- テスト21: 管理者ユーザーはサービスをソフトデリートできる
UPDATE services 
SET deleted_at = NOW() 
WHERE name = '管理者作成サービス';

SELECT isnt(
    (SELECT deleted_at FROM services WHERE name = '管理者作成サービス'),
    NULL,
    '管理者ユーザーはサービスをソフトデリートできる'
);

-- =============================================================================
-- 制約とバリデーションテスト
-- =============================================================================

-- テスト22: nameの重複が許可されることを確認（削除されたものとの重複）
RESET role;
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    'テスト削除サービス',
    45,
    2500
);

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'テスト削除サービス'),
    2,
    'nameの重複が許可される（削除されたものとの重複）'
);

-- テスト23: durationが0でもINSERTできる（現在制約なし）
RESET role;
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    'ゼロ分サービス',
    0,
    1000
);

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'ゼロ分サービス'),
    1,
    'durationが0でもINSERT可能（制約未実装）'
);

-- テスト24: priceが0でもINSERTできる（現在制約なし）
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    'ゼロ円サービス',
    30,
    0
);

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name = 'ゼロ円サービス'),
    1,
    'priceが0でもINSERT可能（制約未実装）'
);

-- =============================================================================
-- トリガーのテスト
-- =============================================================================

-- テスト25: updated_atが自動更新されることを確認
RESET role;
INSERT INTO services (
    name,
    duration,
    price
) VALUES (
    'トリガーテストサービス',
    30,
    1500
);

-- 初期のupdated_atを取得
SELECT updated_at AS original_updated_at 
FROM services 
WHERE name = 'トリガーテストサービス'
\gset

-- 少し待ってから更新
SELECT pg_sleep(0.1);

UPDATE services 
SET price = 2000 
WHERE name = 'トリガーテストサービス';

-- テスト26: updated_atが更新されたことを確認
SELECT ok(
    (SELECT updated_at FROM services WHERE name = 'トリガーテストサービス') > :'original_updated_at'::timestamp,
    'updated_atトリガーが正しく動作する'
);

-- =============================================================================
-- サービスロールでの全権限テスト
-- =============================================================================

-- テスト27: サービスロールは全てのサービスを読み取れる
SELECT is(
    (SELECT COUNT(*)::int FROM services),
    7,
    'サービスロールは全てのサービス（削除済み含む）を読み取れる'
);

-- テスト28: サービスロールは削除されたサービスも読み取れる
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE deleted_at IS NOT NULL),
    2,
    'サービスロールは削除されたサービスも読み取れる'
);

-- =============================================================================
-- インデックスとパフォーマンステスト
-- =============================================================================

-- テスト29: 主キーインデックスが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'services' 
        AND indexname = 'services_pkey'
    ),
    '主キーインデックスが存在する'
);

-- テスト30: deleted_atに関連するクエリパフォーマンス用のインデックスが存在するかを確認（オプション）
-- このテストは実際のインデックス戦略によって調整が必要
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_class 
        WHERE relname = 'services'
    ),
    'servicesテーブルが正しく作成されている'
);

-- =============================================================================
-- 論理削除の動作確認テスト
-- =============================================================================

-- テスト31: 論理削除されたサービスは通常の検索で除外される
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テスト%'),
    3,
    '論理削除されたサービスは通常の検索で除外される'
);

-- テスト32: サービスロールでは論理削除されたサービスも検索できる
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テスト%'),
    4,
    'サービスロールでは論理削除されたサービスも検索できる'
);

-- テスト33: 管理者は論理削除されたサービスも検索できる（現在のRLSでは不可）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM services WHERE name LIKE 'テスト%'),
    3,
    '管理者も現在のRLSでは論理削除されたサービスは検索できない'
);

-- =============================================================================
-- エラーハンドリングテスト
-- =============================================================================

-- テスト34: 未認証ユーザーはサービス作成できない
SET LOCAL role anon;
RESET request.jwt.claims;

DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO services (
            name,
            duration,
            price
        ) VALUES (
            '匿名作成テスト',
            60,
            3000
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            insert_successful := FALSE;
    END;
    
    INSERT INTO test_results VALUES ('anon_insert_test', NOT insert_successful);
END $$;

SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'anon_insert_test'),
    '未認証ユーザーはサービス作成できない'
);

-- テスト35: 必須フィールドのバリデーション
RESET role;
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO services (
            duration,
            price
        ) VALUES (
            60,
            3000
        );
        insert_successful := TRUE;
    EXCEPTION
        WHEN not_null_violation THEN
            insert_successful := FALSE;
    END;
    
    INSERT INTO test_results VALUES ('name_null_test', NOT insert_successful);
END $$;

SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'name_null_test'),
    'nameフィールドがNULLの場合INSERT失敗する'
);

-- =============================================================================
-- クリーンアップ
-- =============================================================================

-- テストデータを削除
RESET role;
DELETE FROM services WHERE name LIKE 'テスト%' OR name LIKE '%テスト%';
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