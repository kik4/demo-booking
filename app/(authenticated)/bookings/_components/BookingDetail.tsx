"use client";

import type { Booking } from "@/app/(authenticated)/bookings/_actions/getBookingsAction";
import { formatDateStringYMDW } from "@/lib/formatDateStringYMDW";
import { formatTime } from "@/lib/formatTime";
import { normalizeDateTime } from "@/lib/normalizeDateTime";

interface BookingDetailProps {
  booking: Booking;
  onClose: () => void;
  customerName: string;
}

export function BookingDetail({
  booking,
  onClose,
  customerName,
}: BookingDetailProps) {
  // Calculate duration
  const calculateDuration = (startTime: string, endTime: string) => {
    const normalizedStartTime = normalizeDateTime(startTime);
    const normalizedEndTime = normalizeDateTime(endTime);

    const start = new Date(normalizedStartTime);
    const end = new Date(normalizedEndTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    return durationMinutes;
  };

  // Check if booking is upcoming
  const isUpcoming = (startTime: string) => {
    const now = new Date();
    const normalizedStartTime = normalizeDateTime(startTime);
    const bookingDate = new Date(normalizedStartTime);
    return bookingDate > now;
  };

  // Format creation date
  const formatCreationDate = (dateString: string) => {
    const normalizedString = normalizeDateTime(dateString);
    const date = new Date(normalizedString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  const duration = calculateDuration(booking.start_time, booking.end_time);
  const upcoming = isUpcoming(booking.start_time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="neumorphism-card max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="sticky top-0 border-gray-200 border-b bg-orange-50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-2xl text-gray-800">予約詳細</h2>
            <button
              type="button"
              onClick={onClose}
              className="neumorphism-button-secondary p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="閉じる"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Status */}
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 font-medium text-sm ${
                upcoming
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {upcoming ? "予約済み" : "完了"}
            </div>
          </div>

          {/* Customer Information */}
          <div className="neumorphism-pressed p-4">
            <h3 className="mb-3 font-semibold text-gray-800 text-lg">
              お客様情報
            </h3>
            <div className="text-sm">
              <span className="text-gray-600">お名前</span>
              <p className="font-medium text-gray-800">{customerName}</p>
            </div>
          </div>

          {/* Service Information */}
          <div className="neumorphism-pressed p-4">
            <h3 className="mb-3 font-semibold text-gray-800 text-lg">
              サービス内容
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-600">サービス名</span>
                <p className="font-medium text-gray-800">
                  {booking.service_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">所要時間</span>
                <p className="font-medium text-gray-800">{duration}分</p>
              </div>
            </div>
          </div>

          {/* Date and Time Information */}
          <div className="neumorphism-pressed p-4">
            <h3 className="mb-3 font-semibold text-gray-800 text-lg">
              予約日時
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-600">予約日</span>
                <p className="font-medium text-gray-800">
                  {formatDateStringYMDW(booking.start_time)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">時間</span>
                <p className="font-medium text-gray-800">
                  {formatTime(booking.start_time)} -{" "}
                  {formatTime(booking.end_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="neumorphism-pressed p-4">
            <h3 className="mb-3 font-semibold text-gray-800 text-lg">
              備考・ご要望
            </h3>
            <div className="min-h-[80px]">
              {booking.notes ? (
                <p className="whitespace-pre-wrap text-gray-700 text-sm">
                  {booking.notes}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">特にありません</p>
              )}
            </div>
          </div>

          {/* Booking Information */}
          <div className="neumorphism-pressed p-4">
            <h3 className="mb-3 font-semibold text-gray-800 text-lg">
              予約情報
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-600">予約番号</span>
                <p className="font-medium text-gray-800">#{booking.id}</p>
              </div>
              <div>
                <span className="text-gray-600">予約作成日時</span>
                <p className="font-medium text-gray-800">
                  {formatCreationDate(booking.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {upcoming && (
            <div className="neumorphism-card bg-yellow-50 p-4">
              <h3 className="mb-2 font-semibold text-yellow-800">
                予約の変更・キャンセル
              </h3>
              <p className="mb-4 text-sm text-yellow-700">
                予約の変更やキャンセルをご希望の場合は、お電話にてお問い合わせください。
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="neumorphism-button-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2"
                >
                  変更依頼
                </button>
                <button
                  type="button"
                  className="neumorphism-button-danger px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                >
                  キャンセル依頼
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-gray-200 border-t bg-orange-50 p-6">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
