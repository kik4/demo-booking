"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { BusinessHours } from "./_components/BusinessHours";
import { WelcomeMessage } from "./_components/WelcomeMessage";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const bookingStatus = searchParams.get("booking");
    if (bookingStatus === "success" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success("予約が完了しました！", {
        className: "neumorphism-toast-success",
      });
      // Clear the query parameter immediately to prevent re-execution
      const url = new URL(window.location.href);
      url.searchParams.delete("booking");
      router.replace(url.pathname + url.search);
    }
  }, [searchParams, router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast.error("ログアウトに失敗しました", {
        className: "neumorphism-toast-error",
      });
    } else {
      router.push("/");
      toast.success("ログアウトしました", {
        className: "neumorphism-toast-success",
      });
    }
  };

  return (
    <div className="pt-24 pb-8">
      <div className="mx-auto max-w-4xl">
        <div className="neumorphism-raised p-8">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="neumorphism-button-secondary px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              ログアウト
            </button>
          </div>
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-bold text-4xl text-gray-800">
              デモ予約システム
            </h1>
            <WelcomeMessage />
            <p className="mt-2 text-gray-600">
              予約の登録・確認・変更・キャンセルが行えます
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="neumorphism-card-green flex flex-col p-6">
              <h3 className="mb-2 font-semibold text-xl">新規予約</h3>
              <p className="mb-4 flex-grow text-green-100">
                新しい予約を登録できます
              </p>
              <button
                type="button"
                onClick={() => router.push("/booking")}
                className="neumorphism-button-glass"
              >
                予約する
              </button>
            </div>

            <div className="neumorphism-card-blue flex flex-col p-6">
              <h3 className="mb-2 font-semibold text-xl">予約管理</h3>
              <p className="mb-4 flex-grow text-blue-100">
                予約の確認・変更・キャンセルができます
              </p>
              <button
                type="button"
                onClick={() => router.push("/bookings")}
                className="neumorphism-button-glass"
              >
                予約を見る
              </button>
            </div>

            <div className="neumorphism-card-purple flex flex-col p-6">
              <h3 className="mb-2 font-semibold text-xl">プロフィール</h3>
              <p className="mb-4 flex-grow text-purple-100">
                プロフィール情報の確認・編集ができます
              </p>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="neumorphism-button-glass"
              >
                確認・編集
              </button>
            </div>
          </div>

          <div className="mt-8">
            <BusinessHours />
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/profile/delete")}
              className="neumorphism-button-danger px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            >
              アカウント削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
