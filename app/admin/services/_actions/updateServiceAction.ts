"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { updateService } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/supabaseClientServer";

export async function updateServiceAction(id: number, formData: FormData) {
  const supabase = await createClient();

  return requireAdminAuth(supabase, async () => {
    // 入力値の検証
    const name = formData.get("name") as string;
    const duration = Number(formData.get("duration"));
    const price = Number(formData.get("price"));

    if (!name || Number.isNaN(duration) || Number.isNaN(price)) {
      return { error: "全てのフィールドを正しく入力してください" };
    }

    try {
      const result = await updateService(
        id,
        { name, duration, price },
        supabase,
      );

      revalidatePath("/admin/services");
      return { success: true, data: result };
    } catch (error) {
      console.error("Error updating service:", error);
      return { error: "サービスの更新に失敗しました" };
    }
  });
}
