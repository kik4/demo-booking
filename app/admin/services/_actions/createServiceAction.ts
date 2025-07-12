"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { requireAdminAuth } from "@/lib/auth";
import { createService } from "@/lib/db/services";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import { serviceSchema } from "../_schemas/serviceSchema";

export async function createServiceAction(formData: FormData) {
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
      const result = await createService({ name, duration, price }, supabase);

      revalidatePath(ROUTES.ADMIN.SERVICES);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error creating service:", error);
      return { error: "サービスの作成に失敗しました" };
    }
  });
}
