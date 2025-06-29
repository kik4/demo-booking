import { createClient } from "@/lib/supabaseClientServer";

export async function getUsers() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users;
}

export interface AdminBooking {
  id: number;
  service_name: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
  profile: {
    id: number;
    name: string;
    name_hiragana: string;
  };
}

export async function getAllBookings() {
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      service_name,
      start_time,
      end_time,
      notes,
      created_at,
      profile:profiles!bookings_profile_id_fkey(
        id,
        name,
        name_hiragana
      )
    `)
    .is("deleted_at", null)
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }

  return bookings as AdminBooking[];
}

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
