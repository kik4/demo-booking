"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { type EditProfileFormState, editProfileAction } from "./actions";

export default function EditProfilePage() {
  const [currentName, setCurrentName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const nameInputId = useId();

  const [state, formAction, pending] = useActionState<
    EditProfileFormState,
    FormData
  >(editProfileAction, {});

  useEffect(() => {
    async function fetchCurrentProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (data) {
          setCurrentName(data.name);
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentProfile();
  }, [router]);

  useEffect(() => {
    if (state.success) {
      toast.success("プロフィールを更新しました", {
        className: "neumorphism-toast-success",
      });
      router.push("/home");
    }
  }, [state.success, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-md">
        <div className="neumorphism-card p-8">
          <h1 className="mb-6 text-center font-bold text-2xl text-gray-900">
            プロフィール編集
          </h1>

          <form action={formAction} className="space-y-6">
            <div>
              <label
                htmlFor={nameInputId}
                className="block font-medium text-gray-700 text-sm"
              >
                名前
              </label>
              <input
                type="text"
                id={nameInputId}
                name="name"
                defaultValue={currentName}
                className="neumorphism-input mt-1 block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="名前を入力してください"
                disabled={pending}
              />
              {state.errors?.name && (
                <p className="mt-1 text-red-600 text-sm">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            {state.errors?._form && (
              <div className="neumorphism-input rounded-md bg-red-100 p-4">
                <p className="text-red-800 text-sm">{state.errors._form[0]}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={pending}
                className="neumorphism-button-primary flex-1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {pending ? "更新中..." : "更新"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/home")}
                disabled={pending}
                className="neumorphism-button-secondary flex-1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
