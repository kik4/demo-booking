"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { safeLog } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/supabaseClientServer";

export async function logoutAction() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    safeLog.error("Logout error:", error);
    // In case of error, we still redirect to root but could handle this better
    // For now, just redirect as the user will see they're still logged in
  }

  redirect(ROUTES.ROOT);
}
