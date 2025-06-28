import type { AvailableTimeSlot } from "./getAvailableTimeSlotsForDate";

export function getIsAvailableTimeSlot(
  timeSlot: AvailableTimeSlot,
  availableSlots: AvailableTimeSlot[],
): boolean {
  for (const aslot of availableSlots) {
    if (
      aslot.start_time <= timeSlot.start_time &&
      aslot.end_time >= timeSlot.end_time
    ) {
      return true;
    }
  }
  return false;
}
