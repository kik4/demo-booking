"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabaseClientServer";
import type { Database } from "@/types/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

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
      .select("*")
      .is("deleted_at", null)
      .order("id");

    if (error) {
      console.error("サービス取得エラー:", error);
      throw new Error("サービス情報の取得に失敗しました");
    }

    return { services: data || [] };
  });
}
