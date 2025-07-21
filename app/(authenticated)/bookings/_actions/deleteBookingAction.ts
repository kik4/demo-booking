"use server";

import { revalidatePath } from "next/cache";
import { requireUserAuth } from "@/lib/auth";
import { deleteBooking } from "@/lib/db/bookings/deleteBooking";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/supabaseClientServer";

interface DeleteBookingResult {
  success?: boolean;
  error?: string;
}

export async function deleteBookingAction(
  bookingId: number,
): Promise<DeleteBookingResult> {
  try {
    const supabase = await createClient();

    const result = await requireUserAuth(supabase, async (authResult) => {
      await deleteBooking(authResult.profile, { bookingId }, supabase);

      revalidatePath(ROUTES.USER.BOOKING.LIST);
      return { success: true };
    });

    if ("error" in result) {
      return {
        error: result.error,
      };
    }

    return result;
  } catch (error) {
    console.error("Error deleting booking:", error);
    return {
      error:
        error instanceof Error ? error.message : "予約の削除に失敗しました",
    };
  }
}
