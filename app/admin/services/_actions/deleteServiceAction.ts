"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { deleteService } from "@/lib/db/services";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/supabaseClientServer";

export async function deleteServiceAction(id: number) {
  const supabase = await createClient();

  return requireAdminAuth(supabase, async () => {
    try {
      const result = await deleteService(id, supabase);

      revalidatePath(ROUTES.ADMIN.SERVICES);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error deleting service:", error);
      return { error: "サービスの削除に失敗しました" };
    }
  });
}
