import { isHoliday } from "japanese-holidays";
import { decimalHoursToTimeString } from "@/lib/decimalHoursToTimeString";
import { splitRange } from "@/lib/splitRange";
import { createServiceClient } from "@/lib/supabaseClientServer";
import { timeToDecimalHoursInTokyo } from "@/lib/timeToDecimalHoursInTokyo";
import { normalizeDateTime } from "./normalizeDateTime";

export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
}

export async function getAvailableTimeSlotsForDate(date: string): Promise<{
  availableSlots: AvailableTimeSlot[];
}> {
  // Check if the date is a business day
  const bookingDate = new Date(`${date}T09:00:00+09:00`);
  const dayOfWeek = bookingDate.getUTCDay(); // 0 = Sunday, 3 = Wednesday

  if (dayOfWeek === 0 || dayOfWeek === 3) {
    return {
      availableSlots: [], // No slots available on closed days
    };
  }

  if (isHoliday(bookingDate)) {
    return {
      availableSlots: [], // No slots available on holidays
    };
  }

  // Get ALL bookings for the specific date (system-wide)
  const startOfDayUTC = new Date(`${date}T00:00:00+09:00`);
  const endOfDayUTC = new Date(`${date}T23:59:59.999+09:00`);

  const serviceSupabase = await createServiceClient();
  const { data: existingBookings, error: bookingsError } = await serviceSupabase
    .from("bookings")
    .select("start_time, end_time")
    .is("deleted_at", null)
    .gte("start_time", startOfDayUTC.toISOString())
    .lte("start_time", endOfDayUTC.toISOString())
    .order("start_time", { ascending: true });

  if (bookingsError) {
    console.error("Bookings fetch error:", bookingsError);
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
