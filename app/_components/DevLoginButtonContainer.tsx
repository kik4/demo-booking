"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export function DevLoginButtonContainer() {
  const router = useRouter();

  const handleDevLogin = async (type: "new" | "user" | "admin") => {
    const { error } = await supabase.auth.signInWithPassword({
      email: `${type}@example.com`,
      password: "password",
    });
    if (error) {
      console.error("Dev login error:", error);
    } else {
      console.log("Dev user logged in");
      router.push("/home");
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
