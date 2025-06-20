import { randomUUID } from "node:crypto";
import type { Database } from "@/types/database.types";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

// テスト用のユニークなIDを生成（並列実行対応）
export const generateTestId = () => randomUUID().replace(/-/g, "_");

// 環境変数を取得
const getSupabaseConfig = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseAnonKey || supabaseAnonKey === "invalid") {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid");
  }

  if (!supabaseServiceKey || supabaseServiceKey === "invalid") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set or invalid");
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey,
  };
};

// シングルトンクライアント
let serviceRoleClient: SupabaseClient<Database> | null = null;
let anonClient: SupabaseClient<Database> | null = null;

// サービスロール用のSupabaseクライアントを作成
export const createServiceRoleClient = () => {
  if (!serviceRoleClient) {
    const config = getSupabaseConfig();
    serviceRoleClient = createClient<Database>(config.url, config.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceRoleClient;
};

// 匿名ユーザー用のクライアントを作成
export const createAnonClient = () => {
  if (!anonClient) {
    const config = getSupabaseConfig();
    anonClient = createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return anonClient;
};

// 認証されたユーザー用のクライアントを作成
export const createAuthenticatedClient = (accessToken: string) => {
  const config = getSupabaseConfig();

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

// テストユーザーを作成するヘルパー関数
export const createTestUser = async (email: string, password: string) => {
  const client = createServiceRoleClient();

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data.user;
};

// テストユーザーでサインインしてアクセストークンを取得
export const signInTestUser = async (email: string, password: string) => {
  const client = createAnonClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }

  return data;
};

// テストデータをクリーンアップ
export const cleanupTestData = async (userIds: string[]) => {
  const client = createServiceRoleClient();

  // テストで作成されたusersレコードを削除
  if (userIds.length > 0) {
    await client.from("users").delete().in("id", userIds);
  }
};

// テストユーザーを削除
export const deleteTestUsers = async (userIds: string[]) => {
  const client = createServiceRoleClient();

  for (const userId of userIds) {
    await client.auth.admin.deleteUser(userId);
  }
};
