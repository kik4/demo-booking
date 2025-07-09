import { createClient } from "@/lib/supabaseClientServer";

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

export async function getServices(
  sortKey: SortKey = "id",
  sortDirection: SortDirection = "asc",
) {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .is("deleted_at", null)
    .order(sortKey, { ascending: sortDirection === "asc" });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return services as AdminService[];
}
