import type { BookingFormData } from "./bookingFormSchema";

/**
 * Calculate end time based on start time and duration
 * @param startTime Time in HH:MM format
 * @param duration Duration in minutes
 * @returns End time in HH:MM format
 */
export function calculateEndTime(startTime: string, duration: number): string {
  if (!startTime) return "";

  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;

  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

/**
 * Validate if a booking step has required fields
 * @param step The step number (1, 2, or 3)
 * @param formData The form data to validate
 * @returns Array of field names to validate for the step
 */
export function getValidationFieldsForStep(
  step: 1 | 2 | 3,
): (keyof BookingFormData)[] {
  switch (step) {
    case 1:
      return ["serviceId", "notes"];
    case 2:
      return ["date", "startTime"];
    case 3:
      return ["serviceId", "date", "startTime", "endTime"];
    default:
      return [];
  }
}
