"use client";

import { useState, useTransition } from "react";
import { ConfirmationModal } from "@/app/_components/ConfirmationModal";
import { deleteBookingAction } from "@/app/(authenticated)/bookings/_actions/deleteBookingAction";
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
  const [isPending, startTransition] = useTransition();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const handleCancelBooking = () => {
    startTransition(async () => {
      try {
        const result = await deleteBookingAction(booking.id);
        if (result.success) {
          onClose();
        } else {
          alert(result.error || "予約の取り消しに失敗しました");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("予約の取り消しに失敗しました");
      }
    });
  };

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
            <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 text-sm">
              予約済み
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
                <p className="whitespace-pre-wrap break-all text-gray-700 text-sm">
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
          <div className="neumorphism-card bg-red-50 p-4">
            <h3 className="mb-2 font-semibold text-red-800">予約の取り消し</h3>
            <p className="mb-4 text-red-700 text-sm">
              予約を取り消すと元に戻すことはできません。本当によろしいですか？
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isPending}
                className="neumorphism-button-danger px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? "処理中..." : "予約を取り消す"}
              </button>
            </div>
          </div>
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

        <ConfirmationModal
          isOpen={showConfirmModal}
          title="予約の取り消し確認"
          message="この予約を取り消しますか？取り消した予約は元に戻すことができません。"
          confirmText="予約を取り消す"
          cancelText="キャンセル"
          onConfirm={handleCancelBooking}
          onCancel={() => setShowConfirmModal(false)}
          isLoading={isPending}
          danger={true}
        />
      </div>
    </div>
  );
}
