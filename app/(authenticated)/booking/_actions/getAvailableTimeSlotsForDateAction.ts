"use server";

import { requireAuth } from "@/lib/auth";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import { createServiceClient } from "@/lib/supabaseClientServer";

export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
}

export async function getAvailableTimeSlotsForDateAction(date: string): Promise<
  | {
      availableSlots: AvailableTimeSlot[];
    }
  | { error: string }
> {
  const supabase = await createServiceClient();

  return requireAuth(supabase, async () => {
    return getAvailableTimeSlotsForDate(date, supabase);
  });
}
