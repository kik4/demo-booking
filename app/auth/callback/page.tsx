"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          router.push(ROUTES.ROOT);
          return;
        }

        if (data.session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", data.session.user.id)
            .single();

          if (profile?.role === "admin") {
            router.push(ROUTES.ADMIN.ROOT);
          } else {
            router.push(ROUTES.USER.HOME);
          }
        } else {
          router.push(ROUTES.ROOT);
        }
      } catch (error) {
        console.error("Callback error:", error);
        router.push(ROUTES.ROOT);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-gray-600">認証中...</p>
      </div>
    </div>
  );
}
