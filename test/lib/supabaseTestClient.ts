import { randomUUID } from "node:crypto";
import type { Database } from "@/types/database.types";
import {
  type SupabaseClient,
  type User,
  createClient,
} from "@supabase/supabase-js";

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
const config = getSupabaseConfig();

class MultiClientManager {
  serviceClient: SupabaseClient<Database> | undefined;
  clients: Map<string, SupabaseClient<Database>>;
  users: Map<string, User>;

  constructor() {
    this.clients = new Map();
    this.users = new Map();
  }

  async createAnonUser(userId?: string) {
    const key = `test-user-${generateTestId()}`;
    const client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        storageKey: key,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.clients.set(userId || key, client);
    return client;
  }

  async createAndSignInUser(userId: string, email: string, password: string) {
    // サービスロールでユーザー作成
    const serviceClient = this.getServiceClient();
    const { data: userData, error } = await serviceClient.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
      },
    );

    if (error) throw error;

    this.users.set(userId, userData.user);

    // 匿名クライアントでサインイン
    const client = await this.createAnonUser(userId);
    await client.auth.signInWithPassword({ email, password });

    return { client, user: userData.user };
  }

  getClient(userId: string) {
    return this.clients.get(userId);
  }

  getUser(userId: string) {
    return this.users.get(userId);
  }

  getServiceClient() {
    if (!this.serviceClient) {
      this.serviceClient = createClient<Database>(
        config.url,
        config.serviceKey,
        {
          auth: {
            storageKey: "test-service",
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );
    }
    return this.serviceClient;
  }

  async cleanup() {
    const serviceClient = this.getServiceClient();

    // 全ユーザーをサインアウト
    for (const client of this.clients.values()) {
      await client.auth.signOut();
    }

    // 作成したユーザーを削除
    for (const user of this.users.values()) {
      await serviceClient.auth.admin.deleteUser(user.id);
    }

    this.clients.clear();
    this.users.clear();
  }
}

export const multiClientManager = new MultiClientManager();

// テストデータをクリーンアップ
export const cleanupTestData = async () => {
  const client = multiClientManager.getServiceClient();

  // テストで作成されたprofilesレコードを削除
  await client.from("profiles").delete().neq("id", 0);
};
