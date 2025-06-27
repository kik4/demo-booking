"use client";

import { isHoliday } from "japanese-holidays";
import { useCallback, useEffect, useId, useState } from "react";
import {
  type ExistingBooking,
  getExistingBookingsForDateAction,
} from "../actions";

interface DateTimeSelectionProps {
  selectedDate: string;
  selectedTime: string;
  serviceDuration: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function DateTimeSelection({
  selectedDate,
  selectedTime,
  serviceDuration,
  onDateChange,
  onTimeChange,
  onPrevious,
  onNext,
  disabled = false,
}: DateTimeSelectionProps) {
  const dateInputId = useId();
  const timeSelectId = useId();
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>(
    [],
  );

  // Check if a date is valid (not Wednesday, Sunday, or holiday)
  const isValidDate = useCallback((dateString: string) => {
    if (!dateString) return true; // Allow empty for validation message

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 3 = Wednesday

    // Check for Wednesday or Sunday
    if (dayOfWeek === 0 || dayOfWeek === 3) {
      return false;
    }

    // Check for Japanese holidays
    if (isHoliday(date)) {
      return false;
    }

    return true;
  }, []);

  // Fetch existing bookings when date changes
  useEffect(() => {
    if (!selectedDate || !isValidDate(selectedDate)) {
      setExistingBookings([]);
      return;
    }

    getExistingBookingsForDateAction(selectedDate)
      .then((result) => {
        if (result.success && result.bookings) {
          setExistingBookings(result.bookings);
        } else {
          setExistingBookings([]);
        }
      })
      .catch(() => {
        setExistingBookings([]);
      });
  }, [selectedDate, isValidDate]);

  // Generate available time slots based on business hours
  const generateTimeSlots = () => {
    const slots = [];

    // Morning slots: 9:00-13:00
    for (let hour = 9; hour < 13; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const endHour = hour + Math.floor((minute + serviceDuration) / 60);
        const endMinute = (minute + serviceDuration) % 60;

        // Check if service fits within morning slot
        if (endHour < 13 || (endHour === 13 && endMinute === 0)) {
          const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
          slots.push({ start: startTime, end: endTime, period: "morning" });
        }
      }
    }

    // Afternoon slots: 15:00-19:00
    for (let hour = 15; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const endHour = hour + Math.floor((minute + serviceDuration) / 60);
        const endMinute = (minute + serviceDuration) % 60;

        // Check if service fits within afternoon slot
        if (endHour < 19 || (endHour === 19 && endMinute === 0)) {
          const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
          slots.push({ start: startTime, end: endTime, period: "afternoon" });
        }
      }
    }

    return slots;
  };

  // Check if a time slot overlaps with existing bookings
  const isTimeSlotAvailable = (startTime: string, endTime: string) => {
    const slotStart = new Date(`${selectedDate}T${startTime}:00`);
    const slotEnd = new Date(`${selectedDate}T${endTime}:00`);

    return !existingBookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      // Check if there's any overlap
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });
  };

  const timeSlots = generateTimeSlots().filter((slot) =>
    isTimeSlotAvailable(slot.start, slot.end),
  );

  // Check if the date is a holiday
  const getHolidayInfo = (dateString: string) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    return isHoliday(date);
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Check if afternoon slots should be available for the selected date
  const isAfternoonAvailable = (dateString: string) => {
    if (!dateString) return true;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 6 = Saturday
    return dayOfWeek !== 6; // Saturday afternoon is closed
  };

  const selectedEndTime =
    selectedTime && timeSlots.find((slot) => slot.start === selectedTime)?.end;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 font-bold text-2xl text-gray-800">日時選択</h2>
        <p className="text-gray-600">ご希望の予約日時を選択してください</p>
      </div>

      <div className="neumorphism-card bg-amber-50 p-4">
        <h3 className="mb-2 font-semibold text-amber-800">営業時間</h3>
        <div className="space-y-1 text-amber-700 text-sm">
          <p>午前: 9:00 - 13:00</p>
          <p>午後: 15:00 - 19:00</p>
          <p className="text-red-600">休業日: 水曜日・日曜日・祝日・年末年始</p>
          <p className="text-red-600">土曜日午後は休業</p>
        </div>
      </div>

      <div>
        <label
          htmlFor={dateInputId}
          className="mb-2 block font-medium text-gray-700 text-sm"
        >
          予約日 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id={dateInputId}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          min={getMinDate()}
          className="neumorphism-input block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={disabled}
        />
        {selectedDate && !isValidDate(selectedDate) && (
          <div className="mt-1 text-red-600 text-sm">
            {(() => {
              const date = new Date(selectedDate);
              const dayOfWeek = date.getDay();
              const isHolidayDate = getHolidayInfo(selectedDate);

              if (isHolidayDate) {
                return "祝日のため休業日です。他の日をお選びください。";
              }
              if (dayOfWeek === 0) {
                return "日曜日は休業日です。他の日をお選びください。";
              }
              if (dayOfWeek === 3) {
                return "水曜日は休業日です。他の日をお選びください。";
              }
              return "選択された日は休業日です。他の日をお選びください。";
            })()}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor={timeSelectId}
          className="mb-2 block font-medium text-gray-700 text-sm"
        >
          予約時間 <span className="text-red-500">*</span>
        </label>
        <select
          id={timeSelectId}
          value={selectedTime}
          onChange={(e) => onTimeChange(e.target.value)}
          className="neumorphism-input block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={disabled || !selectedDate || !isValidDate(selectedDate)}
        >
          <option value="">時間を選択してください</option>
          <optgroup label="午前 (9:00-13:00)">
            {timeSlots
              .filter((slot) => slot.period === "morning")
              .map((slot) => (
                <option key={slot.start} value={slot.start}>
                  {slot.start} - {slot.end} ({serviceDuration}分)
                </option>
              ))}
          </optgroup>
          {isAfternoonAvailable(selectedDate) && (
            <optgroup label="午後 (15:00-19:00)">
              {timeSlots
                .filter((slot) => slot.period === "afternoon")
                .map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {slot.start} - {slot.end} ({serviceDuration}分)
                  </option>
                ))}
            </optgroup>
          )}
        </select>

        {selectedDate &&
          isValidDate(selectedDate) &&
          timeSlots.length === 0 && (
            <div className="neumorphism-card mt-3 bg-red-50 p-3">
              <p className="text-red-700 text-sm">
                この日はすべての時間帯が予約済みです。他の日をお選びください。
              </p>
            </div>
          )}
      </div>

      {selectedTime && selectedEndTime && (
        <div className="neumorphism-card bg-green-50 p-4">
          <h3 className="mb-2 font-semibold text-green-800">
            選択された予約時間
          </h3>
          <div className="space-y-1 text-green-700 text-sm">
            <p>
              <span className="font-medium">開始時間:</span> {selectedTime}
            </p>
            <p>
              <span className="font-medium">終了時間:</span> {selectedEndTime}
            </p>
            <p>
              <span className="font-medium">所要時間:</span> {serviceDuration}分
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disabled}
          className="neumorphism-button-secondary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={
            !selectedDate ||
            !selectedTime ||
            !isValidDate(selectedDate) ||
            disabled
          }
          className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
