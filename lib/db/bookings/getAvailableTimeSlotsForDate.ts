import type { SupabaseClient } from "@supabase/supabase-js";
import japaneseHolidays from "japanese-holidays";
import { decimalHoursToTimeString } from "@/lib/decimalHoursToTimeString";
import { safeLog } from "@/lib/sanitize";
import { splitRange } from "@/lib/splitRange";
import { timeToDecimalHoursInTokyo } from "@/lib/timeToDecimalHoursInTokyo";
import type { Database } from "@/types/database.types";
import { normalizeDateTime } from "../../normalizeDateTime";
import type { AvailableTimeSlot } from "./types";

function isYearEndPeriod(date: Date): boolean {
  const month = date.getUTCMonth() + 1; // getMonth() returns 0-11, so add 1
  const day = date.getUTCDate();

  // December 29, 30, 31
  if (month === 12 && day >= 29) {
    return true;
  }

  // January 1, 2, 3
  if (month === 1 && day <= 3) {
    return true;
  }

  return false;
}

export async function getAvailableTimeSlotsForDate(
  date: string,
  supabase: SupabaseClient<Database>,
): Promise<{
  availableSlots: AvailableTimeSlot[];
  message?: string;
}> {
  // Check if the date is a business day
  const bookingDate = new Date(`${date}T09:00:00+09:00`);
  const dayOfWeek = bookingDate.getUTCDay(); // 0 = Sunday, 3 = Wednesday

  // Check if the date is during year-end/new year period first
  if (isYearEndPeriod(bookingDate)) {
    return {
      availableSlots: [],
      message: "年末年始期間（12月29日〜1月3日）は休業日です",
    };
  }

  if (dayOfWeek === 0 || dayOfWeek === 3) {
    return {
      availableSlots: [],
      message: dayOfWeek === 0 ? "日曜日は休業日です" : "水曜日は休業日です",
    };
  }

  if (japaneseHolidays.isHoliday(bookingDate)) {
    return {
      availableSlots: [],
      message: "祝日は休業日です",
    };
  }

  // Get ALL bookings for the specific date (system-wide)
  const startOfDayUTC = new Date(`${date}T00:00:00+09:00`);
  const endOfDayUTC = new Date(`${date}T23:59:59.999+09:00`);

  const { data: existingBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .is("deleted_at", null)
    .gte("start_time", startOfDayUTC.toISOString())
    .lte("start_time", endOfDayUTC.toISOString())
    .order("start_time", { ascending: true });

  if (bookingsError) {
    safeLog.error("Bookings fetch error:", bookingsError);
    throw bookingsError;
  }

  // Define business hours
  const morningStart = new Date("1990-01-01T09:00:00+09:00");
  const morningEnd = new Date("1990-01-01T13:00:00+09:00");
  const afternoonStart = new Date("1990-01-01T15:00:00+09:00");
  const afternoonEnd = new Date("1990-01-01T19:00:00+09:00");

  // Create business hours periods
  let businessPeriods: Array<{ start: number; end: number }> = [
    {
      start: timeToDecimalHoursInTokyo(morningStart),
      end: timeToDecimalHoursInTokyo(morningEnd),
    }, // Morning: 9:00-13:00
  ];

  // Add afternoon period if not Saturday
  if (dayOfWeek !== 6) {
    businessPeriods.push({
      start: timeToDecimalHoursInTokyo(afternoonStart),
      end: timeToDecimalHoursInTokyo(afternoonEnd),
    }); // Afternoon: 15:00-19:00
  }

  // Convert existing bookings to time periods
  const bookingPeriods =
    existingBookings?.map((booking) => {
      const startTime = new Date(normalizeDateTime(booking.start_time));
      const endTime = new Date(normalizeDateTime(booking.end_time));

      return {
        start: timeToDecimalHoursInTokyo(startTime),
        end: timeToDecimalHoursInTokyo(endTime),
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
    availableSlots,
  };
}
