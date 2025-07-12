"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SEX_OPTIONS } from "@/constants/sexCode";
import { ROUTES } from "@/lib/routes";
import {
  type ProfileFormData,
  profileFormSchema,
} from "../profile/_schemas/profileSchema";
import { registerAction } from "./_actions/registerAction";

export default function RegisterPage() {
  const nameId = useId();
  const nameHiraganaId = useId();
  const sexId = useId();
  const dateOfBirthId = useId();
  const router = useRouter();

  const form = useForm<ProfileFormData>({
    resolver: valibotResolver(profileFormSchema),
    defaultValues: {
      name: "",
      nameHiragana: "",
      sex: "", // 未選択状態（空文字列）
      dateOfBirth: "",
    },
  });

  const onSubmit = async (values: ProfileFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("nameHiragana", values.nameHiragana);
      formData.append("sex", values.sex);
      formData.append("dateOfBirth", values.dateOfBirth);

      const result = await registerAction({}, formData);

      if (result.success) {
        router.push(ROUTES.USER.HOME);
        toast.success("プロフィールを登録しました", {
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

  const { isSubmitting, isSubmitSuccessful } = form.formState;
  const disabled = isSubmitting || isSubmitSuccessful;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="neumorphism-card w-full max-w-md p-8">
        <h1 className="mb-6 text-center font-bold text-2xl text-gray-900">
          新規登録
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {...form.register("name")}
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="お名前を入力してください"
              disabled={disabled}
            />
            <div className="mt-1 text-gray-500 text-xs">
              {form.watch("name")?.length || 0}/100文字
            </div>
            {form.formState.errors.name && (
              <div className="mt-1 text-red-500 text-sm">
                {form.formState.errors.name.message}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor={nameHiraganaId}
              className="mb-2 block font-medium text-gray-700 text-sm"
            >
              お名前（ひらがな） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={nameHiraganaId}
              {...form.register("nameHiragana")}
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="おなまえをひらがなでにゅうりょくしてください"
              disabled={disabled}
            />
            <div className="mt-1 text-gray-500 text-xs">
              {form.watch("nameHiragana")?.length || 0}/100文字
            </div>
            {form.formState.errors.nameHiragana && (
              <div className="mt-1 text-red-500 text-sm">
                {form.formState.errors.nameHiragana.message}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor={sexId}
              className="mb-2 block font-medium text-gray-700 text-sm"
            >
              性別 <span className="text-red-500">*</span>
            </label>
            <select
              id={sexId}
              {...form.register("sex")}
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="mt-1 text-red-500 text-sm">
                {form.formState.errors.sex.message}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor={dateOfBirthId}
              className="mb-2 block font-medium text-gray-700 text-sm"
            >
              生年月日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id={dateOfBirthId}
              max={new Date().toISOString().split("T")[0]}
              {...form.register("dateOfBirth")}
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
            {form.formState.errors.dateOfBirth && (
              <div className="mt-1 text-red-500 text-sm">
                {form.formState.errors.dateOfBirth.message}
              </div>
            )}
          </div>

          {form.formState.errors.root && (
            <div className="neumorphism-input rounded-md bg-red-100 p-3 text-red-500 text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="neumorphism-button-primary w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disabled ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </div>
  );
}
