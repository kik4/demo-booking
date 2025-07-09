"use client";

import { useEffect, useId, useState } from "react";
import {
  type AvailableTimeSlot,
  getAvailableTimeSlotsForDateAction,
} from "../_actions/getAvailableTimeSlotsForDateAction";

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
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [hasError, setHasError] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setHasError(false);
      setValidationMessage("");
      return;
    }

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
      });
  }, [selectedDate]);

  // Generate time slots for the selected service duration
  const generateTimeSlotsForService = () => {
    if (!availableSlots.length) return [];

    const slots = [];
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
        currentTime = new Date(
          currentTime.getTime() + timeInterval * 60 * 1000,
        );
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlotsForService();

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
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
          aria-describedby={
            validationMessage ? `${dateInputId}-message` : undefined
          }
        />
        {selectedDate && !hasError && validationMessage && (
          <div
            id={`${dateInputId}-message`}
            className="mt-1 text-amber-600 text-sm"
          >
            {validationMessage}
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
          disabled={disabled || !selectedDate || hasError}
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
          {timeSlots.filter((slot) => slot.period === "afternoon").length >
            0 && (
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
          !hasError &&
          !validationMessage &&
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
          disabled={!selectedDate || !selectedTime || hasError || disabled}
          className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
