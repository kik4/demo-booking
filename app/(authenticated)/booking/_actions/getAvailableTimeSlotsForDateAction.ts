"use server";

import { requireAuth } from "@/lib/auth";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import type { AvailableTimeSlot } from "@/lib/db/bookings/types";
import { createClient, createServiceClient } from "@/lib/supabaseClientServer";

export async function getAvailableTimeSlotsForDateAction(date: string): Promise<
  | {
      availableSlots: AvailableTimeSlot[];
      message?: string;
    }
  | { error: string }
> {
  const supabase = await createClient();

  return requireAuth(supabase, async () => {
    // Use service client for getting booking to bypass RLS
    const serviceClient = await createServiceClient();

    return getAvailableTimeSlotsForDate(date, serviceClient);
  });
}
