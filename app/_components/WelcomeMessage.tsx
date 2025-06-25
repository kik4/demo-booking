"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export function WelcomeMessage() {
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoaded(true);
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
        setIsLoaded(true);
      }
    }

    fetchProfile();
  }, []);

  return (
    <p
      className={`font-semibold text-gray-700 text-lg transition-opacity duration-500 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {profileName ? `${profileName}さん、ようこそ` : "ようこそ"}
    </p>
  );
}
