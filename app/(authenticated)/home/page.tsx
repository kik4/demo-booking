"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { WelcomeMessage } from "@/app/_components/WelcomeMessage";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast.error("ログアウトに失敗しました");
    } else {
      router.push("/");
      toast.success("ログアウトしました");
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
              予約の作成・確認・変更・キャンセルが行えます
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="neumorphism-card-blue p-6">
              <h3 className="mb-2 font-semibold text-xl">予約管理</h3>
              <p className="mb-4 text-blue-100">
                予約の確認・変更・キャンセルができます
              </p>
              <button type="button" className="neumorphism-button-glass">
                予約を見る
              </button>
            </div>

            <div className="neumorphism-card-green p-6">
              <h3 className="mb-2 font-semibold text-xl">新規予約</h3>
              <p className="mb-4 text-green-100">新しい予約を作成できます</p>
              <button type="button" className="neumorphism-button-glass">
                予約する
              </button>
            </div>

            <div className="neumorphism-card-purple p-6">
              <h3 className="mb-2 font-semibold text-xl">プロフィール</h3>
              <p className="mb-4 text-purple-100">
                アカウント情報を管理できます
              </p>
              <button
                type="button"
                onClick={() => router.push("/profile/edit")}
                className="neumorphism-button-glass"
              >
                設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
