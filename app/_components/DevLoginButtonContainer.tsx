"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export function DevLoginButtonContainer() {
  const router = useRouter();

  const handleDevLogin = async (type: "new" | "user") => {
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
        onClick={() => handleDevLogin("new")}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        未登録ユーザでログイン
      </button>
      <button
        type="button"
        onClick={() => handleDevLogin("user")}
        className="rounded bg-green-500 px-4 py-2 text-white"
      >
        新規ユーザーでログイン
      </button>
    </div>
  );
}
