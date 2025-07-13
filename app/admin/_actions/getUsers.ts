import { createClient } from "@/lib/supabase/supabaseClientServer";

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

export async function getUsers(
  sortKey: SortKey = "created_at",
  sortDirection: SortDirection = "desc",
) {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order(sortKey, { ascending: sortDirection === "asc" });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users;
}
