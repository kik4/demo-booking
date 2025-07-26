"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { safeLog } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase/supabaseClient";

export function DevLoginButtonContainer() {
  const router = useRouter();

  const handleDevLogin = async (type: "new" | "user" | "admin") => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${type}@example.com`,
      password: "password",
    });
    if (error) {
      safeLog.error("Dev login error:", error);
    } else {
      safeLog.info("Dev user logged in");
      router.push(ROUTES.USER.HOME);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p>開発用ログイン</p>
      <button
        type="button"
        onClick={() => handleDevLogin("user")}
        className="neumorphism-pressed px-6 py-3 text-gray-700"
      >
        登録ユーザーでログイン
      </button>
      <button
        type="button"
        onClick={() => handleDevLogin("new")}
        className="neumorphism-pressed px-6 py-3 text-gray-700"
      >
        未登録ユーザーでログイン
      </button>
      <button
        type="button"
        onClick={() => handleDevLogin("admin")}
        className="neumorphism-pressed px-6 py-3 text-gray-700"
      >
        管理者でログイン
      </button>
    </div>
  );
}
