"use client";

import { useState } from "react";
import type { Booking } from "@/app/(authenticated)/bookings/_actions/getBookingsAction";
import { formatDateStringYMDW } from "@/lib/formatDateStringYMDW";
import { formatTime } from "@/lib/formatTime";
import { normalizeDateTime } from "@/lib/normalizeDateTime";

interface BookingListProps {
  bookings: Booking[];
  onBookingSelect?: (booking: Booking) => void;
}

export function BookingList({ bookings, onBookingSelect }: BookingListProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null,
  );

  // Check if booking is upcoming
  const isUpcoming = (startTime: string) => {
    const now = new Date();
    const normalizedStartTime = normalizeDateTime(startTime);
    const bookingDate = new Date(normalizedStartTime);
    return bookingDate > now;
  };

  // Check if booking is today
  const isToday = (startTime: string) => {
    const today = new Date();
    const normalizedStartTime = normalizeDateTime(startTime);
    const bookingDate = new Date(normalizedStartTime);
    return (
      today.getFullYear() === bookingDate.getFullYear() &&
      today.getMonth() === bookingDate.getMonth() &&
      today.getDate() === bookingDate.getDate()
    );
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBookingId(booking.id);
    if (onBookingSelect) {
      onBookingSelect(booking);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="neumorphism-card p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="カレンダーアイコン"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 font-semibold text-gray-800 text-lg">
          予約がありません
        </h3>
      </div>
    );
  }

  // Separate upcoming and past bookings
  const upcomingBookings = bookings.filter((booking) =>
    isUpcoming(booking.start_time),
  );
  const pastBookings = bookings.filter(
    (booking) => !isUpcoming(booking.start_time),
  );

  return (
    <div className="space-y-6">
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-gray-800 text-lg">
            今後の予約 ({upcomingBookings.length}件)
          </h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => handleBookingClick(booking)}
                className={`neumorphism-card w-full cursor-pointer p-4 text-left transition-all duration-200 hover:shadow-lg ${
                  selectedBookingId === booking.id ? "ring-2 ring-blue-500" : ""
                } ${isToday(booking.start_time) ? "bg-green-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {booking.service_name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {formatDateStringYMDW(booking.start_time)}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </p>
                      </div>
                      {isToday(booking.start_time) && (
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium text-green-700 text-sm">
                            今日
                          </span>
                        </div>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="mt-2 line-clamp-2 text-gray-600 text-sm">
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="詳細を見る"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-gray-800 text-lg">
            過去の予約 ({pastBookings.length}件)
          </h2>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => handleBookingClick(booking)}
                className={`neumorphism-card w-full cursor-pointer p-4 text-left opacity-75 transition-all duration-200 hover:shadow-lg ${
                  selectedBookingId === booking.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700">
                          {booking.service_name}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {formatDateStringYMDW(booking.start_time)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {formatTime(booking.start_time)} -{" "}
                          {formatTime(booking.end_time)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-500 text-sm">
                          完了
                        </span>
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="mt-2 line-clamp-2 text-gray-500 text-sm">
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="詳細を見る"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
