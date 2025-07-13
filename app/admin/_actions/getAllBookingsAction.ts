import { requireAdminAuth } from "@/lib/auth";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

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

export async function getAllBookingsAction(): Promise<AdminBooking[]> {
  const supabase = await createClient();

  // Check admin authentication
  const authResult = await requireAdminAuth(supabase, async () => {
    return { authenticated: true };
  });
  if ("error" in authResult) {
    console.error("Admin authentication failed:", authResult.error);
    return [];
  }

  // Use service client for admin operations
  const serviceClient = await createServiceClient();
  const { data: bookings, error } = await serviceClient
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

  return bookings;
}
