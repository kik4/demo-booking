"use server";

import { requireAuth } from "@/lib/auth";
import { safeLog } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import type { Service } from "./types";

export async function getServicesAction(): Promise<
  | {
      services: Service[];
    }
  | { error: string }
> {
  const supabase = await createClient();

  return requireAuth(supabase, async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration")
      .is("deleted_at", null)
      .order("id");

    if (error) {
      safeLog.error("サービス取得エラー:", error);
      throw new Error("サービス情報の取得に失敗しました");
    }

    return { services: data || [] };
  });
}
