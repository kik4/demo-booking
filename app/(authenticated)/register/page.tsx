"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId } from "react";
import { type RegisterFormState, registerAction } from "./actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<
    RegisterFormState,
    FormData
  >(registerAction, {});
  const nameId = useId();
  const nameHiraganaId = useId();
  const sexId = useId();
  const dateOfBirthId = useId();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/home");
    }
  }, [state.success, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="neumorphism-card w-full max-w-md p-8">
        <h1 className="mb-6 text-center font-bold text-2xl text-gray-900">
          新規登録
        </h1>

        <form action={formAction} className="space-y-6">
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
              name="name"
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="お名前を入力してください"
              maxLength={100}
              disabled={isPending}
            />
            {state.errors?.name && (
              <div className="mt-1 text-red-500 text-sm">
                {state.errors.name.map((error, _index) => (
                  <div key={error}>{error}</div>
                ))}
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
              name="nameHiragana"
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="おなまえをひらがなでにゅうりょくしてください"
              maxLength={100}
              disabled={isPending}
            />
            {state.errors?.nameHiragana && (
              <div className="mt-1 text-red-500 text-sm">
                {state.errors.nameHiragana.map((error, _index) => (
                  <div key={error}>{error}</div>
                ))}
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
              name="sex"
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
              defaultValue=""
            >
              <option value="" disabled>
                性別を選択してください
              </option>
              <option value="1">男性</option>
              <option value="2">女性</option>
              <option value="0">回答しない</option>
              <option value="9">その他</option>
            </select>
            {state.errors?.sex && (
              <div className="mt-1 text-red-500 text-sm">
                {state.errors.sex.map((error, _index) => (
                  <div key={error}>{error}</div>
                ))}
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
              name="dateOfBirth"
              className="neumorphism-input w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            />
            {state.errors?.dateOfBirth && (
              <div className="mt-1 text-red-500 text-sm">
                {state.errors.dateOfBirth.map((error, _index) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </div>

          {state.errors?._form && (
            <div className="neumorphism-input rounded-md bg-red-100 p-3 text-red-500 text-sm">
              {state.errors._form.map((error, _index) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="neumorphism-button-primary w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </div>
  );
}
