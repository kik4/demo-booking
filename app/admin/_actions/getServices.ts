import { createClient } from "@/lib/supabaseClientServer";

export interface AdminService {
  id: number;
  name: string;
  duration: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export async function getServices() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .is("deleted_at", null)
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return services as AdminService[];
}
