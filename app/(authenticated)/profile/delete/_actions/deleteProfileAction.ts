"use server";

import { requireUserAuth } from "@/lib/auth";
import { safeLog } from "@/lib/sanitize";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export async function deleteProfileAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();

  const result = await requireUserAuth(supabase, async (authResult) => {
    // サービスロールクライアントを使用してソフトデリート
    // （RLSの複雑さを回避し、認証チェックで安全性を担保）
    const serviceSupabase = await createServiceClient();
    const { data, error: updateError } = await serviceSupabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("user_id", authResult.user.id)
      .is("deleted_at", null)
      .select("id");

    if (updateError) {
      safeLog.error("Profile deletion failed:", updateError);
      throw new Error("アカウント削除に失敗しました");
    }

    if (!data || data.length === 0) {
      safeLog.error("No profile found to delete for user:", authResult.user.id);
      throw new Error("削除対象のプロフィールが見つかりませんでした");
    }

    // ユーザーをログアウト
    await supabase.auth.signOut();

    return { success: true };
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  return result as { success: true };
}
