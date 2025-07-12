import { useEffect, useState } from "react";
import type { AvailableTimeSlot } from "@/lib/db/bookings/types";
import { getAvailableTimeSlotsForDateAction } from "../_actions/getAvailableTimeSlotsForDateAction";

interface TimeSlot {
  start: string;
  end: string;
  period: "morning" | "afternoon";
}

interface UseTimeSlotsReturn {
  timeSlots: TimeSlot[];
  hasError: boolean;
  validationMessage: string;
  loading: boolean;
}

/**
 * Generate time slots for a service based on available slots and duration
 */
function generateTimeSlotsForService(
  availableSlots: AvailableTimeSlot[],
  selectedDate: string,
  serviceDuration: number,
): TimeSlot[] {
  if (!availableSlots.length) return [];

  const slots: TimeSlot[] = [];
  const timeInterval = 30; // 30分間隔

  for (const availableSlot of availableSlots) {
    const slotStart = new Date(
      `${selectedDate}T${availableSlot.start_time}:00`,
    );
    const slotEnd = new Date(`${selectedDate}T${availableSlot.end_time}:00`);

    // 30分間隔で開始時刻を生成
    let currentTime = new Date(slotStart);

    while (currentTime < slotEnd) {
      // サービス終了時刻を計算
      const serviceEndTime = new Date(
        currentTime.getTime() + serviceDuration * 60 * 1000,
      );

      // サービスがこの空き時間内に収まるかチェック
      if (serviceEndTime <= slotEnd) {
        const startTimeString = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;
        const endTimeString = `${serviceEndTime.getHours().toString().padStart(2, "0")}:${serviceEndTime.getMinutes().toString().padStart(2, "0")}`;

        slots.push({
          start: startTimeString,
          end: endTimeString,
          period: currentTime.getHours() < 13 ? "morning" : "afternoon",
        });
      }

      // 次の時間間隔に進む
      currentTime = new Date(currentTime.getTime() + timeInterval * 60 * 1000);
    }
  }

  return slots;
}

/**
 * Custom hook for managing time slots and availability
 */
export function useTimeSlots(
  selectedDate: string,
  serviceDuration: number,
): UseTimeSlotsReturn {
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [hasError, setHasError] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setHasError(false);
      setValidationMessage("");
      setLoading(false);
      return;
    }

    setLoading(true);
    getAvailableTimeSlotsForDateAction(selectedDate)
      .then((result) => {
        if ("availableSlots" in result) {
          setAvailableSlots(result.availableSlots);
          setHasError(false);
          setValidationMessage(result.message || "");
        } else {
          setAvailableSlots([]);
          setHasError(true);
          setValidationMessage(
            "日付の確認中にエラーが発生しました。もう一度お試しください。",
          );
        }
      })
      .catch(() => {
        setAvailableSlots([]);
        setHasError(true);
        setValidationMessage(
          "日付の確認中にエラーが発生しました。もう一度お試しください。",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDate]);

  const timeSlots = generateTimeSlotsForService(
    availableSlots,
    selectedDate,
    serviceDuration,
  );

  return {
    timeSlots,
    hasError,
    validationMessage,
    loading,
  };
}
