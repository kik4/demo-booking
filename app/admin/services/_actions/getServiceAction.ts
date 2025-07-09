"use server";

import { getService } from "@/lib/db/services";
import { createClient } from "@/lib/supabaseClientServer";

export async function getServiceAction(id: number) {
  try {
    const supabase = await createClient();
    const result = await getService(id, supabase);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting service:", error);
    return { error: "サービスの取得に失敗しました" };
  }
}
