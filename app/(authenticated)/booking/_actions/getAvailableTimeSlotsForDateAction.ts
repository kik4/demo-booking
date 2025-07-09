"use server";

import { requireAuth } from "@/lib/auth";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import { createClient, createServiceClient } from "@/lib/supabaseClientServer";

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
  const supabase = await createClient();

  return requireAuth(supabase, async () => {
    // Use service client for creating booking to bypass RLS
    const serviceClient = await createServiceClient();

    return getAvailableTimeSlotsForDate(date, serviceClient);
  });
}
