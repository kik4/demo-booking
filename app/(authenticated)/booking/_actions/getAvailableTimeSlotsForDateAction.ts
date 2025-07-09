"use server";

import { requireAuth } from "@/lib/auth";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export async function getAvailableTimeSlotsForDateAction(
  date: string,
): Promise<
  Awaited<ReturnType<typeof getAvailableTimeSlotsForDate>> | { error: string }
> {
  const supabase = await createClient();

  return requireAuth(supabase, async () => {
    // Use service client for getting booking to bypass RLS
    const serviceClient = await createServiceClient();

    return getAvailableTimeSlotsForDate(date, serviceClient);
  });
}
