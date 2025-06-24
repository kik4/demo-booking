"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function UserInfo() {
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await supabase
        .from("profiles")
        .select("name")
        .filter("user_id", "eq", user.id)
        .filter("deleted_at", "is", null)
        .single();
      if (!res.data) return;
      setProfile(res.data);
    };
    getProfile();
  }, []);

  if (!profile) return <div>未ログイン</div>;

  return (
    <div className="flex flex-col items-center">
      <p>こんにちは、{profile.name} さん！</p>
      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          location.reload();
        }}
        className="rounded bg-red-500 px-4 py-2 text-white"
      >
        ログアウト
      </button>
    </div>
  );
}
