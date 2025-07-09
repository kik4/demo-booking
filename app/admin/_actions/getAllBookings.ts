import { createClient } from "@/lib/supabase/supabaseClientServer";

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
