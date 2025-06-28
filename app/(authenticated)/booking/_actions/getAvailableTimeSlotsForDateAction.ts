"use server";

import { getAvailableTimeSlotsForDate } from "@/lib/getAvailableTimeSlotsForDate";
import { createClient } from "@/lib/supabaseClientServer";

export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
}

export async function getAvailableTimeSlotsForDateAction(
  date: string,
): Promise<{
  availableSlots: AvailableTimeSlot[];
}> {
  const supabase = await createClient();

  // Get current user for authentication check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("認証エラー");
  }

  return getAvailableTimeSlotsForDate(date);
}
