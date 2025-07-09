"use server";

import { requireUserAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabaseClientServer";

export interface Booking {
  id: number;
  service_name: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
}

export async function getBookingsAction(): Promise<{
  success: boolean;
  bookings?: Booking[];
  error?: string;
}> {
  const supabase = await createClient();

  const result = await requireUserAuth(supabase, async (authResult) => {
    try {
      // Get bookings for the user
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, service_name, start_time, end_time, notes, created_at")
        .eq("profile_id", authResult.profile.id)
        .is("deleted_at", null)
        .order("start_time", { ascending: true });

      if (bookingsError) {
        console.error("Bookings fetch error:", bookingsError);
        return {
          success: false,
          error: "予約情報の取得に失敗しました",
        };
      }

      return {
        success: true,
        bookings: bookings || [],
      };
    } catch (error) {
      console.error("Unexpected error:", error);
      return {
        success: false,
        error: "予期しないエラーが発生しました",
      };
    }
  });

  if ("error" in result) {
    return {
      success: false,
      error: result.error,
    };
  }

  return result;
}
