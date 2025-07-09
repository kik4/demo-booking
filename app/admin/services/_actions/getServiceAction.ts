"use server";

import { requireAdminAuth } from "@/lib/auth";
import { getService } from "@/lib/db/services";
import { createClient } from "@/lib/supabaseClientServer";

export async function getServiceAction(id: number) {
  const supabase = await createClient();

  return requireAdminAuth(supabase, async () => {
    try {
      const result = await getService(id, supabase);

      return { success: true, data: result };
    } catch (error) {
      console.error("Error getting service:", error);
      return { error: "サービスの取得に失敗しました" };
    }
  });
}
