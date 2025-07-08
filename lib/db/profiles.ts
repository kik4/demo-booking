import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { ROLE_CODES, type RoleCode } from "@/constants/roleCode";
import { SEX_CODES, type SexCode } from "@/constants/sexCode";
import type { Database } from "@/types/database.types";

const profileValidationSchema = v.object({
  name: v.pipe(
    v.string("名前は有効な値を入力してください"),
    v.trim(),
    v.minLength(2, "名前は2文字以上で入力してください"),
    v.maxLength(100, "名前は100文字以内で入力してください"),
  ),
  name_hiragana: v.pipe(
    v.string("ひらがな名前は有効な値を入力してください"),
    v.trim(),
    v.minLength(2, "ひらがな名前は2文字以上で入力してください"),
    v.maxLength(100, "ひらがな名前は100文字以内で入力してください"),
    v.regex(/^[ひらがな\u3040-\u309F\u30FC\s]+$/, "ひらがなで入力してください"),
  ),
  sex: v.pipe(
    v.number("性別は有効な値を入力してください"),
    v.picklist(Object.values(SEX_CODES), "性別は有効な値を選択してください"),
  ),
  date_of_birth: v.pipe(
    v.string("生年月日は有効な値を入力してください"),
    v.trim(),
    v.isoDate("生年月日は正しい日付形式で入力してください"),
    v.maxValue(
      new Date().toISOString().split("T")[0],
      "生年月日は今日以前の日付を入力してください",
    ),
  ),
  role: v.pipe(
    v.string("ロールは有効な値を入力してください"),
    v.trim(),
    v.picklist(Object.values(ROLE_CODES), "ロールは有効な値を選択してください"),
  ),
});

const updateProfileValidationSchema = v.partial(profileValidationSchema);

export const createProfile = async (
  user: { id: string },
  params: {
    name: string;
    name_hiragana: string;
    sex: SexCode;
    date_of_birth: string;
    role: RoleCode;
  },
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(profileValidationSchema, params);

  const { data, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, ...parsed })
    .select()
    .single();
  if (error || !data) {
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};

export const updateProfile = async (
  user: { id: string },
  params: {
    name?: string;
    name_hiragana?: string;
    sex?: SexCode;
    date_of_birth?: string;
    role?: RoleCode;
  },
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(updateProfileValidationSchema, params);

  // Remove undefined values to avoid updating with null
  const updateData = Object.fromEntries(
    Object.entries(parsed).filter(([_, value]) => value !== undefined),
  );

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};
