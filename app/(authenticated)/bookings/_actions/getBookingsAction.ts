"use server";

import { requireUserAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/supabaseClientServer";

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
  try {
    const supabase = await createClient();

    const result = await requireUserAuth(supabase, async (authResult) => {
      // Get bookings for the user (excluding bookings from previous day and earlier)
      // Use JST timezone for today calculation
      const now = new Date();
      const jstOffset = 9 * 60; // JST is UTC+9
      const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
      const today = new Date(
        `${jstTime.toISOString().slice(0, 10)}T00:00+09:00`,
      );

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, service_name, start_time, end_time, notes, created_at")
        .eq("profile_id", authResult.profile.id)
        .is("deleted_at", null)
        .gte("start_time", today.toISOString())
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
    });

    if ("error" in result) {
      return {
        success: false,
        error: result.error,
      };
    }

    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
