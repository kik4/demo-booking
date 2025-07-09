"use server";

import { revalidatePath } from "next/cache";
import { deleteService } from "@/lib/db/services";
import { createClient } from "@/lib/supabaseClientServer";

export async function deleteServiceAction(id: number) {
  try {
    const supabase = await createClient();
    const result = await deleteService(id, supabase);

    revalidatePath("/admin/services");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { error: "サービスの削除に失敗しました" };
  }
}
