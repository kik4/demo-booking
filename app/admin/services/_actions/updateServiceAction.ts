"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { requireAdminAuth } from "@/lib/auth";
import { updateService } from "@/lib/db/services";
import { ROUTES } from "@/lib/routes";
import { safeLog } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import { serviceSchema } from "../_schemas/serviceSchema";

export async function updateServiceAction(id: number, formData: FormData) {
  const supabase = await createClient();

  return requireAdminAuth(supabase, async () => {
    // 入力値の検証
    const rawData = {
      name: formData.get("name") as string,
      duration: Number(formData.get("duration")),
      price: Number(formData.get("price")),
    };

    const result = v.safeParse(serviceSchema, rawData);
    if (!result.success) {
      const firstError = result.issues[0];
      return { error: firstError?.message || "入力値が無効です" };
    }

    const { name, duration, price } = result.output;

    try {
      const result = await updateService(
        id,
        { name, duration, price },
        supabase,
      );

      revalidatePath(ROUTES.ADMIN.SERVICES);
      return { success: true, data: result };
    } catch (error) {
      safeLog.error("Error updating service:", error);
      return { error: "サービスの更新に失敗しました" };
    }
  });
}
