"use server";

import { createClient } from "@/lib/supabaseClientServer";
import { validateProfile } from "@/lib/validation";

export interface EditProfileFormState {
  errors?: {
    name?: string[];
    nameHiragana?: string[];
    sex?: string[];
    dateOfBirth?: string[];
    _form?: string[];
  };
  success?: boolean;
  formData?: {
    name: string;
    nameHiragana: string;
    sex: string;
    dateOfBirth: string;
  };
}

export async function editProfileAction(
  _prevState: EditProfileFormState,
  formData: FormData,
): Promise<EditProfileFormState> {
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
    return {
      errors: validation.errors,
      formData: { name, nameHiragana, sex, dateOfBirth },
    };
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
        formData: { name, nameHiragana, sex, dateOfBirth },
      };
    }

    // プロフィールを更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: validation.data.name,
        name_hiragana: validation.data.nameHiragana,
        sex: validation.data.sex,
        date_of_birth: validation.data.dateOfBirth,
      })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      return {
        errors: {
          _form: ["更新に失敗しました。もう一度お試しください。"],
        },
        formData: { name, nameHiragana, sex, dateOfBirth },
      };
    }

    return { success: true };
  } catch {
    return {
      errors: {
        _form: ["予期しないエラーが発生しました"],
      },
      formData: { name, nameHiragana, sex, dateOfBirth },
    };
  }
}
