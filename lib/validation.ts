import { z } from "zod";

export const profileValidationSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須項目です")
    .trim()
    .min(2, "名前は2文字以上で入力してください")
    .max(100, "名前は100文字以内で入力してください"),
});

export type ProfileValidationInput = z.input<typeof profileValidationSchema>;
export type ProfileValidationOutput = z.output<typeof profileValidationSchema>;

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
  const result = profileValidationSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
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
