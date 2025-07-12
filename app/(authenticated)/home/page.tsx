import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { logoutAction } from "./_actions/logoutAction";
import { BusinessHours } from "./_components/BusinessHours";
import { WelcomeMessage } from "./_components/WelcomeMessage";

export default function HomePage() {
  return (
    <div className="pt-24 pb-8">
      <div className="mx-auto max-w-4xl">
        <div className="neumorphism-raised p-8">
          <div className="mb-4 flex justify-end">
            <form action={logoutAction}>
              <button
                type="submit"
                className="neumorphism-button-secondary px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                ログアウト
              </button>
            </form>
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
              <Link
                href={ROUTES.USER.BOOKING.NEW}
                className="neumorphism-button-glass"
              >
                予約する
              </Link>
            </div>

            <div className="neumorphism-card-blue flex flex-col p-6">
              <h3 className="mb-2 font-semibold text-xl">予約管理</h3>
              <p className="mb-4 flex-grow text-blue-100">
                予約の確認・変更・キャンセルができます
              </p>
              <Link
                href={ROUTES.USER.BOOKING.LIST}
                className="neumorphism-button-glass"
              >
                予約を見る
              </Link>
            </div>

            <div className="neumorphism-card-purple flex flex-col p-6">
              <h3 className="mb-2 font-semibold text-xl">プロフィール</h3>
              <p className="mb-4 flex-grow text-purple-100">
                プロフィール情報の確認・編集ができます
              </p>
              <Link
                href={ROUTES.USER.PROFILE.ROOT}
                className="neumorphism-button-glass"
              >
                確認・編集
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <BusinessHours />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={ROUTES.USER.PROFILE.DELETE}
              className="neumorphism-button-danger px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            >
              アカウント削除
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
