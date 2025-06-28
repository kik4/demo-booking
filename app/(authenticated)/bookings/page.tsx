"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabaseClient";
import { BookingDetail } from "./_components/BookingDetail";
import { BookingList } from "./_components/BookingList";
import { type Booking, getBookingsAction } from "./actions";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get customer name
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(ROUTES.ROOT);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (profile) {
          setCustomerName(profile.name);
        }

        // Get bookings
        const result = await getBookingsAction();

        if (result.success && result.bookings) {
          setBookings(result.bookings);
        } else {
          setError(result.error || "予約情報の取得に失敗しました");
          toast.error(result.error || "予約情報の取得に失敗しました", {
            className: "neumorphism-toast-error",
          });
        }
      } catch (error) {
        console.error("Data fetch error:", error);
        setError("予期しないエラーが発生しました");
        toast.error("予期しないエラーが発生しました", {
          className: "neumorphism-toast-error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetail = () => {
    setSelectedBooking(null);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getBookingsAction();

      if (result.success && result.bookings) {
        setBookings(result.bookings);
        toast.success("予約情報を更新しました", {
          className: "neumorphism-toast-success",
        });
      } else {
        setError(result.error || "予約情報の取得に失敗しました");
        toast.error(result.error || "予約情報の取得に失敗しました", {
          className: "neumorphism-toast-error",
        });
      }
    } catch (error) {
      console.error("Refresh error:", error);
      setError("予期しないエラーが発生しました");
      toast.error("予期しないエラーが発生しました", {
        className: "neumorphism-toast-error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl">
        <div className="neumorphism-raised p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 font-bold text-3xl text-gray-900">
                  予約確認
                </h1>
                <p className="text-gray-600">
                  あなたの予約一覧です。予約をクリックして詳細を確認できます。
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="neumorphism-button-secondary inline-flex flex-col items-center px-4 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="更新"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <p className="text-sm">更新</p>
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="neumorphism-input mb-6 rounded-md bg-red-100 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="エラー"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Booking List */}
          <BookingList
            bookings={bookings}
            onBookingSelect={handleBookingSelect}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => router.push(ROUTES.USER.HOME)}
              className="neumorphism-button-secondary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              ホームに戻る
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.USER.BOOKING.NEW)}
              className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              新規予約をする
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking}
          customerName={customerName}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
