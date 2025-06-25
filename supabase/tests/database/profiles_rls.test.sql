-- profiles_rls_test.sql
-- プロフィールのRLS（行レベルセキュリティ）機能の包括的なpgTAPテスト

BEGIN;
SELECT plan(33);

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
), (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test3@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
), (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'testadmin@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- =============================================================================
-- プロフィールの作成と読み取りテスト
-- =============================================================================

-- テスト1: 認証されたユーザーが自分のデータを作成できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'profile_test1',
    'ぷろふぃーるてすと1',
    1,
    '1990-01-01'
);

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    1,
    '認証されたユーザーが自分のデータを作成できる'
);

-- テスト2: 認証されたユーザーが自分のデータを読み取れる
SELECT is(
    (SELECT name FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    'profile_test1',
    '認証されたユーザーが自分のデータを読み取れる'
);

-- サービスロールでuser2のプロフィールを作成
RESET role;
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'profile_test2',
    'ぷろふぃーるてすと2',
    2,
    '1991-02-02'
);

-- テスト3: 認証されたユーザーが自分のデータのみを読み取れる（user1視点）
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    1,
    '認証されたユーザーが自分のデータのみを読み取れる（user1）'
);

-- テスト4: 認証されたユーザーが自分のデータのみを読み取れる（user2視点）
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    1,
    '認証されたユーザーが自分のデータのみを読み取れる（user2）'
);

SELECT is(
    (SELECT name FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    'profile_test2',
    'user2が自分のデータを正しく読み取れる'
);

-- テスト5: 認証されたユーザーが他のユーザーのデータを直接取得できない
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    0,
    '認証されたユーザーが他のユーザーのデータを直接取得できない'
);

-- テスト6: サービスロールクライアントは全てのデータにアクセスできる
RESET role;

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id IN ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid)),
    2,
    'サービスロールクライアントは全てのデータにアクセスできる'
);

-- テスト7: 認証されたユーザーが自分のデータのみを更新できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

UPDATE profiles 
SET name = 'テスト一郎' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

SELECT is(
    (SELECT name FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    'テスト一郎',
    '認証されたユーザーが自分のデータを更新できる'
);

-- テスト8: 認証されたユーザーが他のユーザーのデータを更新できない
UPDATE profiles 
SET name = 'テスト次郎' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid;

-- user2のデータが変更されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT name FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    'profile_test2',
    '認証されたユーザーが他のユーザーのデータを更新できない'
);

-- =============================================================================
-- 削除されたプロフィールの作成と読み取りテスト
-- =============================================================================

-- テスト9: 削除されたプロフィールを作成
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth,
    deleted_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'profile_deleted',
    'ぷろふぃーるでりーてっど',
    0,
    '1990-01-01',
    NOW()
);

-- テスト10: 認証されたユーザーでも削除された自分のデータは読み取れない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440003", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'::uuid),
    0,
    '認証されたユーザーでも削除された自分のデータは読み取れない'
);

-- テスト11: サービスロールでは削除されたデータも読み取れる
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'::uuid),
    1,
    'サービスロールでは削除されたデータも読み取れる'
);

-- テスト12: 認証されたユーザーでも削除された自分のデータは更新できない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440003", "role": "authenticated"}';

UPDATE profiles 
SET name = 'テスト更新' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'::uuid;

-- サービスロールで更新されていないことを確認
RESET role;
SELECT is(
    (SELECT name FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'::uuid),
    'profile_deleted',
    '認証されたユーザーでも削除された自分のデータは更新できない'
);

-- =============================================================================
-- RLSポリシーの動作確認テスト
-- =============================================================================

-- テスト13: 未認証ユーザー（anon）はデータを読み取れない
SET LOCAL role anon;
RESET request.jwt.claims;

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    0,
    '未認証ユーザーはデータを読み取れない'
);

-- テスト14: 未認証ユーザーは特定のuser_idでもデータを読み取れない
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    0,
    '未認証ユーザーは特定のuser_idでもデータを読み取れない'
);

-- テスト15: 未認証ユーザーはデータを作成できない
-- DO ブロックでエラーをキャッチしてテストの継続を可能にする
DO $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO profiles (
            user_id,
            name,
            name_hiragana,
            sex,
            date_of_birth
        ) VALUES (
            '550e8400-e29b-41d4-a716-446655440001'::uuid,
            'anon_test',
            'あのんてすと',
            1,
            '1990-01-01'
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
    
    INSERT INTO test_results VALUES ('anon_insert_test', NOT insert_successful);
END $$;

-- 作成されていないことを確認（サービスロールで確認）
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE name = 'anon_test'),
    0,
    '未認証ユーザーはデータを作成できない'
);

-- DO ブロックの結果も確認
SELECT ok(
    (SELECT result FROM test_results WHERE test_name = 'anon_insert_test'),
    '未認証ユーザーのINSERTが適切に拒否される'
);

-- テスト17: RLSが有効になっていることを確認
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
    'profilesテーブルでRLSが有効になっている'
);

-- テスト18: selectポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'SELECT' 
        AND policyname = 'Enable users to view their own data only'
    ),
    'selectポリシーが存在する'
);

-- テスト19: insertポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'INSERT' 
        AND policyname = 'Enable insert for users based on user_id'
    ),
    'insertポリシーが存在する'
);

-- テスト20: updateポリシーが存在することを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'UPDATE' 
        AND policyname = 'Enable users to update their own data only'
    ),
    'updateポリシーが存在する'
);

-- テスト21: selectポリシーにdeleted_at IS NULLの条件が含まれることを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'SELECT' 
        AND qual LIKE '%deleted_at IS NULL%'
    ),
    'selectポリシーにdeleted_at IS NULLの条件が含まれる'
);

-- テスト22: updateポリシーにdeleted_at IS NULLの条件が含まれることを確認
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'UPDATE' 
        AND qual LIKE '%deleted_at IS NULL%'
    ),
    'updateポリシーにdeleted_at IS NULLの条件が含まれる'
);

-- =============================================================================
-- 複数ユーザー並列アクセステスト
-- =============================================================================

-- 複数ユーザーが並列でアクセスしても互いのデータは見えないことをテスト

-- テスト23: user1は自分のデータのみ見える
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    1,
    'user1は自分のデータのみ見える'
);

SELECT is(
    (SELECT user_id FROM profiles LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'user1が見えるデータは自分のもの'
);

-- テスト24: user2は自分のデータのみ見える
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    1,
    'user2は自分のデータのみ見える'
);

-- テスト25: user3（削除済み）は自分のデータが見えない
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440003", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    0,
    'user3（削除済み）は自分のデータが見えない'
);

-- =============================================================================
-- Adminユーザーのアクセステスト
-- =============================================================================

-- adminユーザーのプロフィールを作成（サービスロール）
RESET role;
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    'admin_user',
    'あどみんゆーざー',
    1,
    '1985-01-01',
    'admin'
);

-- テスト26: adminユーザーは全てのユーザーのプロフィールを閲覧できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440004", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE deleted_at IS NULL),
    3,
    'adminユーザーは全てのユーザーのプロフィールを閲覧できる'
);

-- テスト27: adminユーザーは他のユーザーの具体的なデータを参照できる
SELECT ok(
    EXISTS(
        SELECT 1 FROM profiles 
        WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid 
        AND name = 'テスト一郎'
    ),
    'adminユーザーは他のユーザーの具体的なデータを参照できる'
);

-- テスト28: adminユーザーは削除されたプロフィールも見える（管理者権限）
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'::uuid),
    1,
    'adminユーザーは削除されたプロフィールも見える（管理者権限）'
);

-- テスト29: 通常のユーザーはadminのプロフィールも含めて自分のもの以外は見えない
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles),
    1,
    '通常のユーザーはadminのプロフィールも含めて自分のもの以外は見えない'
);

-- テスト30: is_admin_user()関数が正しく動作することを確認
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440004", "role": "authenticated"}';

SELECT ok(
    is_admin_user(),
    'is_admin_user()関数がadminユーザーに対してtrueを返す'
);

-- テスト31: is_admin_user()関数が通常ユーザーに対してfalseを返すことを確認
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT ok(
    NOT is_admin_user(),
    'is_admin_user()関数が通常ユーザーに対してfalseを返す'
);

-- テスト32: adminユーザーが自分のプロフィールも正常に閲覧できることを確認
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440004", "role": "authenticated"}';

SELECT ok(
    EXISTS(
        SELECT 1 FROM profiles 
        WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'::uuid 
        AND name = 'admin_user'
        AND role = 'admin'
    ),
    'adminユーザーが自分のプロフィールも正常に閲覧できる'
);

-- =============================================================================
-- クリーンアップ
-- =============================================================================

-- テストデータを削除
RESET role;
DELETE FROM profiles WHERE user_id IN (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, 
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid
);

DELETE FROM auth.users WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001'::uuid, 
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid
);

SELECT finish();
ROLLBACK;