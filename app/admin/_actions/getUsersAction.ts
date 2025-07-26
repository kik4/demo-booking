import { requireAdminAuth } from "@/lib/auth";
import { safeLog } from "@/lib/sanitize";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export interface AdminUser {
  id: number;
  name: string;
  name_hiragana: string;
  date_of_birth: string;
  sex: number;
  role: string;
  created_at: string;
  updated_at: string;
}

export type SortKey = keyof AdminUser;
export type SortDirection = "asc" | "desc";

export async function getUsersAction(
  sortKey: SortKey = "created_at",
  sortDirection: SortDirection = "desc",
): Promise<AdminUser[]> {
  const supabase = await createClient();

  // Check admin authentication
  const authResult = await requireAdminAuth(supabase, async () => {
    return { authenticated: true };
  });
  if ("error" in authResult) {
    safeLog.error("Admin authentication failed:", authResult.error);
    return [];
  }

  // Use service client for admin operations
  const serviceClient = await createServiceClient();
  const { data: users, error } = await serviceClient
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order(sortKey, { ascending: sortDirection === "asc" });

  if (error) {
    safeLog.error("Error fetching users:", error);
    return [];
  }

  return users;
}
