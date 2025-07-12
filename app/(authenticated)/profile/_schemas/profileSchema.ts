import * as v from "valibot";
import { SEX_CODES } from "@/constants/sexCode";

const baseProfileFields = {
  name: v.pipe(
    v.string("名前は有効な値を入力してください"),
    v.trim(),
    v.minLength(2, "名前は2文字以上で入力してください"),
    v.maxLength(100, "名前は100文字以内で入力してください"),
  ),
  nameHiragana: v.pipe(
    v.string("ひらがな名前は有効な値を入力してください"),
    v.trim(),
    v.minLength(2, "ひらがな名前は2文字以上で入力してください"),
    v.maxLength(100, "ひらがな名前は100文字以内で入力してください"),
    v.regex(/^[ひらがな\u3040-\u309F\u30FC\s]+$/, "ひらがなで入力してください"),
  ),
  dateOfBirth: v.pipe(
    v.string("生年月日は有効な値を入力してください"),
    v.trim(),
    v.isoDate("生年月日は正しい日付形式で入力してください"),
    v.maxValue(
      new Date().toISOString().split("T")[0],
      "生年月日は今日以前の日付を入力してください",
    ),
  ),
};

// 共通のプロフィールスキーマ（Edit/Register両方で使用）
export const profileFormSchema = v.object({
  ...baseProfileFields,
  sex: v.pipe(
    v.string("性別を選択してください"),
    v.minLength(1, "性別を選択してください"),
    v.picklist(
      Object.values(SEX_CODES).map(String),
      "性別は有効な値を選択してください",
    ),
  ),
});

export type ProfileFormData = v.InferInput<typeof profileFormSchema>;
