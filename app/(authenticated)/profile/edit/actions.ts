"use server";

import { createClient } from "@/lib/supabaseClientServer";

export interface EditProfileFormState {
  errors?: {
    name?: string[];
    _form?: string[];
  };
  success?: boolean;
}

export async function editProfileAction(
  _prevState: EditProfileFormState,
  formData: FormData,
): Promise<EditProfileFormState> {
  const name = formData.get("name") as string;

  // サーバーサイドバリデーション
  const errors: EditProfileFormState["errors"] = {};

  if (!name || !name.trim()) {
    errors.name = ["名前は必須項目です"];
  } else if (name.length > 100) {
    errors.name = ["名前は100文字以内で入力してください"];
  } else if (name.trim().length < 2) {
    errors.name = ["名前は2文字以上で入力してください"];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
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

    // プロフィールを更新
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (updateError) {
      return {
        errors: {
          _form: ["更新に失敗しました。もう一度お試しください。"],
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
