import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabaseClientServer";

interface HasProfileLayoutProps {
  children: ReactNode;
}

export default async function HasProfileLayout({
  children,
}: HasProfileLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // プロフィールレコードの存在確認
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  // プロフィールが存在しない場合は登録ページにリダイレクト
  if (!profile) {
    redirect("/register");
  }

  return children;
}
