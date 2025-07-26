import { requireAdminAuth } from "@/lib/auth";
import { safeLog } from "@/lib/sanitize";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export interface AdminService {
  id: number;
  name: string;
  duration: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export type SortKey = keyof AdminService;
export type SortDirection = "asc" | "desc";

export async function getServicesAction(
  sortKey: SortKey = "id",
  sortDirection: SortDirection = "asc",
): Promise<AdminService[]> {
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
  const { data: services, error } = await serviceClient
    .from("services")
    .select("*")
    .is("deleted_at", null)
    .order(sortKey, { ascending: sortDirection === "asc" });

  if (error) {
    safeLog.error("Error fetching services:", error);
    return [];
  }

  return services;
}
