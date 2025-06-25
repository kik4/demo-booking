"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabaseClientServer";

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("認証エラーが発生しました");
  }

  // サービスロールクライアントを使用してソフトデリート
  // （RLSの複雑さを回避し、認証チェックで安全性を担保）
  const serviceSupabase = createServiceClient();
  const { error: updateError } = await serviceSupabase
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error("アカウント削除に失敗しました");
  }

  // ユーザーをログアウト
  await supabase.auth.signOut();

  redirect("/");
}
