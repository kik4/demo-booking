import * as v from "valibot";
import { SEX_CODES } from "@/constants/sexCode";

export const profileEditSchema = v.object({
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
  sex: v.pipe(
    v.number("性別は有効な値を入力してください"),
    v.picklist(Object.values(SEX_CODES), "性別は有効な値を選択してください"),
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
});

export type ProfileEditFormData = v.InferInput<typeof profileEditSchema>;
