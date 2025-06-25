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
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/home");
    }
  }, [state.success, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {state.errors?._form && (
            <div className="rounded-md bg-red-50 p-3 text-red-500 text-sm">
              {state.errors._form.map((error, _index) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "登録中..." : "登録"}
          </button>
        </form>
      </div>
    </div>
  );
}
