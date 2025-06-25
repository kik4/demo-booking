import * as v from "valibot";
import { SEX_CODES } from "@/lib/constants";

export const profileValidationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "名前は2文字以上で入力してください"),
    v.maxLength(100, "名前は100文字以内で入力してください"),
  ),
  nameHiragana: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "ひらがな名前は2文字以上で入力してください"),
    v.maxLength(100, "ひらがな名前は100文字以内で入力してください"),
    v.regex(/^[ひらがな\u3040-\u309F\u30FC\s]+$/, "ひらがなで入力してください"),
  ),
  sex: v.pipe(
    v.number("性別は有効な値を選択してください"),
    v.picklist(Object.values(SEX_CODES), "性別は有効な値を選択してください"),
  ),
  dateOfBirth: v.pipe(
    v.string(),
    v.trim(),
    v.isoDate("生年月日は正しい日付形式で入力してください"),
    v.maxValue(
      new Date().toISOString().split("T")[0],
      "生年月日は今日以前の日付を入力してください",
    ),
  ),
});

export type ProfileValidationInput = v.InferInput<
  typeof profileValidationSchema
>;
export type ProfileValidationOutput = v.InferOutput<
  typeof profileValidationSchema
>;

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  errors: Record<string, string[]>;
}

export function validateProfile(
  input: unknown,
): ValidationResult<ProfileValidationOutput> | ValidationError {
  const result = v.safeParse(profileValidationSchema, input);

  if (result.success) {
    return {
      success: true,
      data: result.output,
    };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.issues) {
    const path = issue.path
      ? issue.path.map((p) => String(p.key)).join(".")
      : "root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return {
    success: false,
    errors,
  };
}
