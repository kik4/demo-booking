"use server";

import { isHoliday } from "japanese-holidays";
import { decimalHoursToTimeString } from "@/lib/decimalHoursToTimeString";
import { splitRange } from "@/lib/splitRange";
import { createClient, createServiceClient } from "@/lib/supabaseClientServer";
import { timeToDecimalHours } from "@/lib/timeToDecimalHours";

export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
}

export async function getAvailableTimeSlotsForDateAction(
  date: string,
): Promise<{
  success: boolean;
  availableSlots?: AvailableTimeSlot[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user for authentication check
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

    // Check if the date is a business day
    const bookingDate = new Date(`${date}T09:00:00+09:00`);
    const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 3 = Wednesday

    if (dayOfWeek === 0 || dayOfWeek === 3) {
      return {
        success: true,
        availableSlots: [], // No slots available on closed days
      };
    }

    if (isHoliday(bookingDate)) {
      return {
        success: true,
        availableSlots: [], // No slots available on holidays
      };
    }

    // Get ALL bookings for the specific date (system-wide)
    const startOfDayUTC = new Date(`${date}T00:00:00+09:00`);
    const endOfDayUTC = new Date(`${date}T23:59:59.999+09:00`);

    const serviceSupabase = await createServiceClient();
    const { data: existingBookings, error: bookingsError } =
      await serviceSupabase
        .from("bookings")
        .select("start_time, end_time")
        .is("deleted_at", null)
        .gte("start_time", startOfDayUTC.toISOString())
        .lte("start_time", endOfDayUTC.toISOString())
        .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
      return {
        success: false,
        error: "予約情報の取得に失敗しました",
      };
    }

    // Define business hours
    const morningStart = new Date("1990-01-01T09:00:00+09:00");
    const morningEnd = new Date("1990-01-01T13:00:00+09:00");
    const afternoonStart = new Date("1990-01-01T15:00:00+09:00");
    const afternoonEnd = new Date("1990-01-01T19:00:00+09:00");

    // Create business hours periods
    let businessPeriods: Array<{ start: number; end: number }> = [
      {
        start: timeToDecimalHours(morningStart),
        end: timeToDecimalHours(morningEnd),
      }, // Morning: 9:00-13:00
    ];

    // Add afternoon period if not Saturday
    if (dayOfWeek !== 6) {
      businessPeriods.push({
        start: timeToDecimalHours(afternoonStart),
        end: timeToDecimalHours(afternoonEnd),
      }); // Afternoon: 15:00-19:00
    }

    // Convert existing bookings to time periods
    const bookingPeriods =
      existingBookings?.map((booking) => {
        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);

        return {
          start: timeToDecimalHours(startTime),
          end: timeToDecimalHours(endTime),
        };
      }) || [];

    // Sort booking periods by start time
    bookingPeriods.sort((a, b) => a.start - b.start);

    // Split available business periods
    for (const bookingPeriod of bookingPeriods) {
      const newBusinessPeriods: Array<{ start: number; end: number }> = [];
      for (const businessPeriod of businessPeriods) {
        const res = splitRange(businessPeriod, bookingPeriod);
        if (res.length) {
          newBusinessPeriods.push(...res);
        }
      }
      businessPeriods = newBusinessPeriods;
    }

    // Calculate available time slots for each business period
    const availableSlots: AvailableTimeSlot[] = [];
    for (const businessPeriod of businessPeriods) {
      availableSlots.push({
        start_time: decimalHoursToTimeString(businessPeriod.start),
        end_time: decimalHoursToTimeString(businessPeriod.end),
      });
    }

    return {
      success: true,
      availableSlots,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
