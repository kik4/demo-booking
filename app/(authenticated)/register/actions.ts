"use server";

import { createClient } from "@/lib/supabaseClientServer";
import { validateProfile } from "@/lib/validation";

export interface RegisterFormState {
  errors?: {
    name?: string[];
    nameHiragana?: string[];
    sex?: string[];
    dateOfBirth?: string[];
    _form?: string[];
  };
  success?: boolean;
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const name = formData.get("name") as string;
  const nameHiragana = formData.get("nameHiragana") as string;
  const sex = formData.get("sex") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;

  const validation = validateProfile({
    name,
    nameHiragana,
    sex: sex ? Number.parseInt(sex, 10) : undefined,
    dateOfBirth,
  });

  if (!validation.success) {
    return { errors: validation.errors };
  }

  try {
    const supabase = await createClient();
    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        errors: {
          _form: ["認証が必要です"],
        },
      };
    }

    // プロフィールを作成
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: validation.data.name,
      name_hiragana: validation.data.nameHiragana,
      sex: validation.data.sex,
      date_of_birth: validation.data.dateOfBirth,
    });

    if (insertError) {
      return {
        errors: {
          _form: ["登録に失敗しました。もう一度お試しください。"],
        },
      };
    }

    return { success: true };
  } catch {
    return {
      errors: {
        _form: ["予期しないエラーが発生しました"],
      },
    };
  }
}
