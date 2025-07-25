import Link from "next/link";
import { redirect } from "next/navigation";
import { SEX_LABELS, type SexCode } from "@/constants/sexCode";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/supabaseClientServer";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(ROUTES.ROOT);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(ROUTES.REGISTER);
  }

  return (
    <div className="pt-24 pb-8">
      <div className="mx-auto max-w-2xl">
        <div className="neumorphism-raised p-8">
          <h1 className="mb-6 font-bold text-3xl text-gray-800">
            プロフィール
          </h1>

          <div className="mb-8 space-y-4">
            <div>
              <span className="block font-medium text-gray-700 text-sm">
                名前
              </span>
              <p className="mt-1 text-gray-900 text-lg">{profile.name}</p>
            </div>

            <div>
              <span className="block font-medium text-gray-700 text-sm">
                ひらがな
              </span>
              <p className="mt-1 text-gray-900 text-lg">
                {profile.name_hiragana}
              </p>
            </div>

            <div>
              <span className="block font-medium text-gray-700 text-sm">
                性別
              </span>
              <p className="mt-1 text-gray-900 text-lg">
                {SEX_LABELS[profile.sex as SexCode] || "不明"}
              </p>
            </div>

            <div>
              <span className="block font-medium text-gray-700 text-sm">
                生年月日
              </span>
              <p className="mt-1 text-gray-900 text-lg">
                {new Date(profile.date_of_birth)
                  .toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/(\d{4})\/(\d{2})\/(\d{2})/, "$1年$2月$3日")}{" "}
                （
                {Math.floor(
                  (Date.now() - new Date(profile.date_of_birth).getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25),
                )}
                歳）
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Link
              href={ROUTES.USER.PROFILE.EDIT}
              className="neumorphism-button-primary w-64 px-8 py-3 text-center"
            >
              プロフィールを編集
            </Link>

            <Link
              href={ROUTES.USER.HOME}
              className="neumorphism-button-secondary w-64 px-8 py-3 text-center"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
