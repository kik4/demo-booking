"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { ROUTES } from "@/lib/routes";
import { deleteProfileAction } from "./_actions/deleteProfileAction";

export default function DeleteAccountPage() {
  const [isPending, startTransition] = useTransition();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProfileAction();
      if (result.success) {
        toast.success("アカウントを削除しました", {
          className: "neumorphism-toast-success",
        });
        router.push(ROUTES.ROOT);
      } else {
        toast.error("error" in result ? result.error : "削除に失敗しました", {
          className: "neumorphism-toast-error",
        });
      }
    });
  };

  if (!showConfirmation) {
    return (
      <div className="pt-24 pb-8">
        <div className="mx-auto max-w-md">
          <div className="neumorphism-raised p-8">
            <h1 className="mb-6 font-bold text-2xl text-red-600">
              アカウント削除
            </h1>

            <div className="mb-6">
              <p className="mb-4 text-gray-700">
                アカウントを削除すると、以下の操作が実行されます：
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-600">
                <li>プロフィール情報が削除されます</li>
                <li>ログイン状態が解除されます</li>
                <li>削除されたアカウントは復元できません</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                className="neumorphism-button-danger w-full px-4 py-2"
              >
                アカウントを削除する
              </button>

              <Link
                href={ROUTES.USER.HOME}
                className="neumorphism-button-secondary block w-full px-4 py-2 text-center"
              >
                キャンセル
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8">
      <div className="mx-auto max-w-md">
        <div className="neumorphism-raised p-8">
          <h1 className="mb-6 font-bold text-2xl text-red-600">
            アカウント削除の確認
          </h1>

          <div className="mb-6">
            <p className="mb-4 font-semibold text-gray-700">
              本当にアカウントを削除しますか？
            </p>
            <p className="text-gray-600 text-sm">
              この操作は取り消せません。削除後はログイン画面に戻ります。
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="neumorphism-button-danger w-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "削除中..." : "削除を実行する"}
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              disabled={isPending}
              className="neumorphism-button-secondary w-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
