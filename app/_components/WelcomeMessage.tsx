"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export function WelcomeMessage() {
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (data) {
          setProfileName(data.name);
        }
      } catch (_err) {
        // エラーは無視して、名前なしで表示
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />;
  }

  return (
    <p className="font-semibold text-gray-700 text-lg">
      {profileName ? `${profileName}さん、ようこそ` : "ようこそ"}
    </p>
  );
}
