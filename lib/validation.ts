import * as v from "valibot";

export const profileValidationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "名前は2文字以上で入力してください"),
    v.maxLength(100, "名前は100文字以内で入力してください"),
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
