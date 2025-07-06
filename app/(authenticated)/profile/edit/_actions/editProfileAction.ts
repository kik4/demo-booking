"use server";

import { camelCase } from "lodash-es";
import { ValiError } from "valibot";
import type { SexCode } from "@/constants/sexCode";
import { updateProfile } from "@/lib/db/profiles";
import { createClient } from "@/lib/supabaseClientServer";

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
    try {
      const { data, error } = await updateProfile(
        user,
        {
          name,
          name_hiragana: nameHiragana,
          sex: (sex ? +sex : undefined) as SexCode,
          date_of_birth: dateOfBirth,
        },
        supabase,
      );
      if (error || !data) {
        return {
          errors: {
            _form: ["登録に失敗しました。もう一度お試しください。"],
          },
          formData: { name, nameHiragana, sex, dateOfBirth },
        };
      }
    } catch (e) {
      if (e instanceof ValiError) {
        const errors: Record<string, string[]> = {};
        for (const issue of e.issues) {
          const path = issue.path
            ? issue.path.map((p: { key: string }) => camelCase(p.key)).join(".")
            : "root";
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
        return {
          errors,
          formData: { name, nameHiragana, sex, dateOfBirth },
        };
      }
      throw e;
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
