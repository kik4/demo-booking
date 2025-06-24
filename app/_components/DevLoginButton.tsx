"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../_lib/supabaseClient";

export function DevLoginButton() {
  const router = useRouter();

  const handleDevLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: "user@example.com",
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
    <button
      type="button"
      onClick={handleDevLogin}
      className="rounded bg-green-500 px-4 py-2 text-white"
    >
      開発用ユーザーでログイン
    </button>
  );
}
