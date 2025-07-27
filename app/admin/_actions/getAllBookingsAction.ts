import { requireAdminAuth } from "@/lib/auth";
import { safeLog } from "@/lib/sanitize";
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
  deleted_at: string | null;
  profile: {
    id: number;
    name: string;
    name_hiragana: string;
  };
}

export type BookingSortKey =
  | "id"
  | "service_name"
  | "start_time"
  | "end_time"
  | "notes"
  | "created_at"
  | "profile_name";

export type BookingSortDirection = "asc" | "desc";

export async function getAllBookingsAction(
  sortKey: BookingSortKey = "start_time",
  sortDirection: BookingSortDirection = "desc",
  includeDeleted = false,
): Promise<AdminBooking[]> {
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

  let query = serviceClient.from("bookings").select(`
      id,
      service_name,
      start_time,
      end_time,
      notes,
      created_at,
      deleted_at,
      profile:profiles!bookings_profile_id_fkey(
        id,
        name,
        name_hiragana
      )
    `);

  // Filter deleted bookings unless includeDeleted is true
  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  // For profile name sorting, we need to reference the profiles table correctly
  if (sortKey === "profile_name") {
    query = query.order("name", {
      ascending: sortDirection === "asc",
      referencedTable: "profiles",
    });
  } else {
    // For other fields, order directly in the database
    query = query.order(sortKey, { ascending: sortDirection === "asc" });
  }
  const { data: bookings, error } = await query;

  if (error) {
    safeLog.error("Error fetching bookings:", error);
    return [];
  }

  return bookings;
}
