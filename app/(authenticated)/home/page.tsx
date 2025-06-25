"use client";

import { useRouter } from "next/navigation";
import { WelcomeMessage } from "@/app/_components/WelcomeMessage";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="pt-24 pb-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-transparent px-3 py-1 text-gray-600 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
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
            <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg">
              <h3 className="mb-2 font-semibold text-xl">予約管理</h3>
              <p className="mb-4 text-blue-100">
                予約の確認・変更・キャンセルができます
              </p>
              <button
                type="button"
                className="rounded-lg bg-white/20 px-4 py-2 font-medium backdrop-blur-sm transition-all hover:bg-white/30"
              >
                予約を見る
              </button>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white shadow-lg">
              <h3 className="mb-2 font-semibold text-xl">新規予約</h3>
              <p className="mb-4 text-green-100">新しい予約を作成できます</p>
              <button
                type="button"
                className="rounded-lg bg-white/20 px-4 py-2 font-medium backdrop-blur-sm transition-all hover:bg-white/30"
              >
                予約する
              </button>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shadow-lg">
              <h3 className="mb-2 font-semibold text-xl">プロフィール</h3>
              <p className="mb-4 text-purple-100">
                アカウント情報を管理できます
              </p>
              <button
                type="button"
                onClick={() => router.push("/profile/edit")}
                className="rounded-lg bg-white/20 px-4 py-2 font-medium backdrop-blur-sm transition-all hover:bg-white/30"
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
