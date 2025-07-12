import * as v from "valibot";

export const serviceSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "サービス名は必須です"),
    v.maxLength(100, "サービス名は100文字以内で入力してください"),
  ),
  duration: v.pipe(
    v.number(),
    v.minValue(1, "所要時間は1分以上で入力してください"),
  ),
  price: v.pipe(
    v.number(),
    v.minValue(100, "料金は100円以上で入力してください"),
  ),
});

export type ServiceFormData = v.InferInput<typeof serviceSchema>;
