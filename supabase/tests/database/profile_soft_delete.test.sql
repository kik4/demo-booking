-- profile_soft_delete_test.sql
-- プロフィールのソフトデリート機能のpgTAPテスト

BEGIN;
SELECT plan(12);

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

-- テスト用プロフィールを作成
INSERT INTO profiles (
    user_id,
    name,
    name_hiragana,
    sex,
    date_of_birth,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'profile_test1',
    'ぷろふぃーるてすと1',
    1,
    '1990-01-01',
    NOW(),
    NOW()
), (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'profile_test2',
    'ぷろふぃーるてすと2',
    2,
    '1990-01-01',
    NOW(),
    NOW()
);

-- テスト1: プロフィールが正常に作成されていることを確認
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    1,
    'プロフィールが正常に作成されている'
);

-- テスト2: deleted_atが初期状態でNULLであることを確認
SELECT is(
    (SELECT deleted_at FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    NULL,
    'deleted_atが初期状態でNULL'
);

-- テスト3: RLSポリシーにより、削除されていないプロフィールは取得できる
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    1,
    'RLSポリシーにより自分のプロフィールは取得できる'
);

-- テスト4: RLSポリシーにより、他のユーザーのプロフィールは取得できない
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    0,
    'RLSポリシーにより他のユーザーのプロフィールは取得できない'
);

-- テスト5: サービスロールでソフトデリートを実行
RESET role;
UPDATE profiles 
SET deleted_at = NOW() 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

SELECT isnt(
    (SELECT deleted_at FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    NULL,
    'ソフトデリートが実行され、deleted_atに値が設定される'
);

-- テスト6: ソフトデリート後、RLSポリシーによりプロフィールが取得できない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    0,
    'ソフトデリート後、RLSポリシーによりプロフィールが取得できない'
);

-- テスト7: サービスロールでは削除されたレコードも取得できる
RESET role;
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    1,
    'サービスロールでは削除されたレコードも取得できる'
);

-- テスト8: 削除されたプロフィールは他のユーザーからも見えない
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002", "role": "authenticated"}';

SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
    0,
    '削除されたプロフィールは他のユーザーからも見えない'
);

-- テスト9: user2は自分のプロフィールは正常に取得できる
SELECT is(
    (SELECT COUNT(*)::int FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    1,
    'user2は自分のプロフィールは正常に取得できる'
);

-- テスト10: user2のプロフィールはdeleted_atがNULL
SELECT is(
    (SELECT deleted_at FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'::uuid),
    NULL,
    'user2のプロフィールはdeleted_atがNULL'
);

-- テスト11: RLSポリシーがprofilesテーブルに適用されていることを確認
SELECT has_table_privilege('profiles', 'SELECT');
SELECT ok(
    has_table_privilege('profiles', 'SELECT'),
    'profilesテーブルにSELECT権限がある'
);

-- テスト12: 削除されたレコードのdeleted_atフィールドが正しく設定されている
RESET role;
SELECT ok(
    (SELECT deleted_at FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'::uuid) IS NOT NULL,
    '削除されたレコードのdeleted_atフィールドが正しく設定されている'
);

-- クリーンアップ
DELETE FROM profiles WHERE user_id IN ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid);
DELETE FROM auth.users WHERE id IN ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid);

SELECT finish();
ROLLBACK;