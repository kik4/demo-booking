"use server";

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
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "認証エラーが発生しました",
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "プロフィール情報が見つかりません",
      };
    }

    // Get bookings for the user
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, service_name, start_time, end_time, notes, created_at")
      .eq("profile_id", profile.id)
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
}
