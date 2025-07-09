"use server";

import { revalidatePath } from "next/cache";
import { createService } from "@/lib/db/services";
import { createClient } from "@/lib/supabaseClientServer";

export async function createServiceAction(formData: FormData) {
  const name = formData.get("name") as string;
  const duration = Number(formData.get("duration"));
  const price = Number(formData.get("price"));

  if (!name || Number.isNaN(duration) || Number.isNaN(price)) {
    return { error: "全てのフィールドを正しく入力してください" };
  }

  try {
    const supabase = await createClient();
    const result = await createService({ name, duration, price }, supabase);

    revalidatePath("/admin/services");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating service:", error);
    return { error: "サービスの作成に失敗しました" };
  }
}
