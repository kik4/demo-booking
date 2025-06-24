"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const nameId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (!name.trim()) {
      setError("名前は必須項目です");
      return;
    }

    if (name.length > 100) {
      setError("名前は100文字以内で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      // 現在のユーザーを取得
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("認証が必要です");
        return;
      }

      // プロフィールを作成または更新
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          name: name.trim(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (upsertError) {
        setError("登録に失敗しました。もう一度お試しください。");
        return;
      }

      // 登録成功後、ホームページにリダイレクト
      router.push("/home");
    } catch {
      setError("予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center font-bold text-2xl text-gray-900">
          新規登録
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor={nameId}
              className="mb-2 block font-medium text-gray-700 text-sm"
            >
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="お名前を入力してください"
              maxLength={100}
              disabled={isLoading}
            />
            <p className="mt-1 text-gray-500 text-xs">{name.length}/100文字</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </div>
  );
}
