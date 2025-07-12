"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/app/_components/LoadingSpinner";
import { SEX_OPTIONS } from "@/constants/sexCode";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabase/supabaseClient";
import {
  type ProfileFormData,
  profileFormSchema,
} from "../_schemas/profileSchema";
import { editProfileAction } from "./_actions/editProfileAction";

export default function EditProfilePage() {
  const router = useRouter();
  const nameInputId = useId();
  const nameHiraganaInputId = useId();
  const sexInputId = useId();
  const dateOfBirthInputId = useId();

  const form = useForm<ProfileFormData>({
    resolver: valibotResolver(profileFormSchema),
    defaultValues: async () => {
      const defaultValue: ProfileFormData = {
        name: "",
        nameHiragana: "",
        sex: "",
        dateOfBirth: "",
      };
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(ROUTES.ROOT);
          return defaultValue;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("name, name_hiragana, sex, date_of_birth")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (error) {
          // プロフィールが存在しない場合は登録ページにリダイレクト
          if (error.code === "PGRST116") {
            toast.error(
              "プロフィールが登録されていません。先にプロフィールを登録してください。",
            );
            router.push(ROUTES.REGISTER);
            return defaultValue;
          }
          // その他のエラーは catch で処理
          throw error;
        }

        if (data) {
          return {
            name: data.name,
            nameHiragana: data.name_hiragana,
            sex: data.sex.toString(),
            dateOfBirth: data.date_of_birth,
          };
        }

        // データが null の場合（削除済みなど）
        toast.error(
          "プロフィールが見つかりません。先にプロフィールを登録してください。",
        );
        router.push(ROUTES.REGISTER);
        return defaultValue;
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        toast.error("プロフィールの取得に失敗しました");
        return defaultValue;
      }
    },
  });

  const onSubmit = async (values: ProfileFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("nameHiragana", values.nameHiragana);
      formData.append("sex", values.sex);
      formData.append("dateOfBirth", values.dateOfBirth);

      const result = await editProfileAction({}, formData);

      if (result.success) {
        router.push(ROUTES.USER.PROFILE.ROOT);
        toast.success("プロフィールを更新しました", {
          className: "neumorphism-toast-success",
        });
      } else {
        // Handle server validation errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof ProfileFormData | "root", {
              message: messages[0],
            });
          });
        }
      }
    } catch {
      form.setError("root", { message: "エラーが発生しました" });
    }
  };

  const { isSubmitting, isSubmitSuccessful, isLoading } = form.formState;
  const disabled = isSubmitting || isSubmitSuccessful;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-md">
        <div className="neumorphism-card p-8">
          <h1 className="mb-6 text-center font-bold text-2xl text-gray-900">
            プロフィール編集
          </h1>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor={nameInputId}
                className="block font-medium text-gray-700 text-sm"
              >
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={nameInputId}
                {...form.register("name")}
                className="neumorphism-input mt-1 block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="お名前を入力してください"
                disabled={disabled}
              />
              <div className="mt-1 text-gray-500 text-xs">
                {form.watch("name")?.length || 0}/100文字
              </div>
              {form.formState.errors.name && (
                <p className="mt-1 text-red-600 text-sm">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={nameHiraganaInputId}
                className="block font-medium text-gray-700 text-sm"
              >
                お名前（ひらがな） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={nameHiraganaInputId}
                {...form.register("nameHiragana")}
                className="neumorphism-input mt-1 block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="おなまえをひらがなでにゅうりょくしてください"
                disabled={disabled}
              />
              <div className="mt-1 text-gray-500 text-xs">
                {form.watch("nameHiragana")?.length || 0}/100文字
              </div>
              {form.formState.errors.nameHiragana && (
                <p className="mt-1 text-red-600 text-sm">
                  {form.formState.errors.nameHiragana.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={sexInputId}
                className="block font-medium text-gray-700 text-sm"
              >
                性別 <span className="text-red-500">*</span>
              </label>
              <select
                id={sexInputId}
                {...form.register("sex")}
                className="neumorphism-input mt-1 block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={disabled}
              >
                <option value="" disabled>
                  性別を選択してください
                </option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.sex && (
                <p className="mt-1 text-red-600 text-sm">
                  {form.formState.errors.sex.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={dateOfBirthInputId}
                className="block font-medium text-gray-700 text-sm"
              >
                生年月日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id={dateOfBirthInputId}
                max={new Date().toISOString().split("T")[0]}
                {...form.register("dateOfBirth")}
                className="neumorphism-input mt-1 block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={disabled}
              />
              {form.formState.errors.dateOfBirth && (
                <p className="mt-1 text-red-600 text-sm">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {form.formState.errors.root && (
              <div className="neumorphism-input rounded-md bg-red-100 p-4">
                <p className="text-red-800 text-sm">
                  {form.formState.errors.root.message}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={disabled}
                className="neumorphism-button-primary flex-1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {disabled ? "更新中..." : "更新"}
              </button>
              <Link
                href={ROUTES.USER.PROFILE.ROOT}
                className={`neumorphism-button-secondary flex-1 px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
