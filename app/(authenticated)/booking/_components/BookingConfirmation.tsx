"use client";

import { formatDateStringYMD } from "@/lib/formatDateStringYMD";

interface BookingData {
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  customerName: string;
}

interface BookingConfirmationProps {
  bookingData: BookingData;
  onPrevious: () => void;
  onConfirm: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export function BookingConfirmation({
  bookingData,
  onPrevious,
  onConfirm,
  disabled = false,
  isSubmitting = false,
}: BookingConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 font-bold text-2xl text-gray-800">予約内容確認</h2>
        <p className="text-gray-600">
          以下の内容で予約を確定します。よろしければ「予約を確定する」ボタンを押してください。
        </p>
      </div>

      <div className="neumorphism-card space-y-4 p-6">
        <div className="border-gray-200 border-b pb-4">
          <h3 className="mb-3 font-semibold text-gray-800 text-lg">
            お客様情報
          </h3>
          <div className="text-sm">
            <span className="text-gray-600">お名前</span>
            <p className="font-medium text-gray-800">
              {bookingData.customerName}
            </p>
          </div>
        </div>

        <div className="border-gray-200 border-b pb-4">
          <h3 className="mb-3 font-semibold text-gray-800 text-lg">
            サービス内容
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-gray-600">サービス名</span>
              <p className="font-medium text-gray-800">
                {bookingData.serviceName}
              </p>
            </div>
            <div>
              <span className="text-gray-600">所要時間</span>
              <p className="font-medium text-gray-800">
                {bookingData.duration}分
              </p>
            </div>
            <div>
              <span className="text-gray-600">料金</span>
              <p className="font-medium text-gray-800">
                ¥{bookingData.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="border-gray-200 border-b pb-4">
          <h3 className="mb-3 font-semibold text-gray-800 text-lg">予約日時</h3>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <span className="text-gray-600">予約日</span>
              <p className="font-medium text-gray-800">
                {formatDateStringYMD(bookingData.date)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">時間</span>
              <p className="font-medium text-gray-800">
                {bookingData.startTime} - {bookingData.endTime}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-gray-800 text-lg">
            備考・ご要望
          </h3>
          <div className="neumorphism-pressed min-h-[80px] p-3">
            {bookingData.notes ? (
              <p className="whitespace-pre-wrap text-gray-700 text-sm">
                {bookingData.notes}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">特にありません</p>
            )}
          </div>
        </div>
      </div>

      <div className="neumorphism-card bg-yellow-50 p-4">
        <h3 className="mb-2 font-semibold text-yellow-800">注意事項</h3>
        <ul className="space-y-1 text-sm text-yellow-700">
          <li>• 予約の変更・キャンセルは前日までにお願いします</li>
          <li>• 当日のキャンセルはキャンセル料が発生する場合があります</li>
          <li>• 遅刻される場合は事前にご連絡ください</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disabled || isSubmitting}
          className="neumorphism-button-secondary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || isSubmitting}
          className="neumorphism-button-primary px-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "予約中..." : "予約を確定する"}
        </button>
      </div>
    </div>
  );
}
