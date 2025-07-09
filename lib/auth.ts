import type { SupabaseClient } from "@supabase/supabase-js";
import { ROLE_CODES } from "@/constants/roleCode";
import type { Database } from "@/types/database.types";

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email?: string;
  };
  profile?: {
    id: number;
    role: string;
  };
  error?: string;
}

/**
 * 認証チェック: ユーザーがログインしているかを確認
 */
async function checkAuth(
  supabase: SupabaseClient<Database>,
): Promise<AuthResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "認証が必要です",
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

/**
 * 管理者権限チェック: ユーザーが管理者であるかを確認
 */
async function checkAdminAuth(
  supabase: SupabaseClient<Database>,
): Promise<AuthResult> {
  // まず認証チェック
  const authResult = await checkAuth(supabase);
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // 管理者権限チェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", authResult.user.id)
    .is("deleted_at", null)
    .single();

  if (!profile || profile.role !== ROLE_CODES.ADMIN) {
    return {
      success: false,
      error: "管理者権限が必要です",
    };
  }

  return {
    success: true,
    user: authResult.user,
    profile: {
      id: profile.id,
      role: profile.role,
    },
  };
}

/**
 * 認証が必要なServer Actionのヘルパー関数
 */
export async function requireAuth<T>(
  supabase: SupabaseClient<Database>,
  callback: (authResult: AuthResult) => Promise<T>,
): Promise<T | { error: string }> {
  const authResult = await checkAuth(supabase);
  if (!authResult.success) {
    return { error: authResult.error || "認証が必要です" };
  }

  return callback(authResult);
}

/**
 * 管理者権限が必要なServer Actionのヘルパー関数
 */
export async function requireAdminAuth<T>(
  supabase: SupabaseClient<Database>,
  callback: (authResult: AuthResult) => Promise<T>,
): Promise<T | { error: string }> {
  const authResult = await checkAdminAuth(supabase);
  if (!authResult.success) {
    return { error: authResult.error || "管理者権限が必要です" };
  }

  return callback(authResult);
}
