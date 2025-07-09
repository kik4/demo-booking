"use server";

import { redirect } from "next/navigation";
import { requireUserAuth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export async function deleteProfileAction() {
  const supabase = await createClient();

  const result = await requireUserAuth(supabase, async (authResult) => {
    // サービスロールクライアントを使用してソフトデリート
    // （RLSの複雑さを回避し、認証チェックで安全性を担保）
    const serviceSupabase = await createServiceClient();
    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("user_id", authResult.user.id);

    if (updateError) {
      throw new Error("アカウント削除に失敗しました");
    }

    // ユーザーをログアウト
    await supabase.auth.signOut();

    return { success: true };
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  redirect(ROUTES.ROOT);
}
