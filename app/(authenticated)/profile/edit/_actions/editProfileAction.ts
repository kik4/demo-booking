"use server";

import { camelCase } from "lodash-es";
import { ValiError } from "valibot";
import type { SexCode } from "@/constants/sexCode";
import { requireUserAuth } from "@/lib/auth";
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

    const result = await requireUserAuth(supabase, async (authResult) => {
      // プロフィールを更新
      try {
        await updateProfile(
          authResult.user,
          {
            name,
            name_hiragana: nameHiragana,
            sex: (sex ? +sex : undefined) as SexCode,
            date_of_birth: dateOfBirth,
          },
          supabase,
        );
        return { success: true };
      } catch (e) {
        if (e instanceof ValiError) {
          const errors: Record<string, string[]> = {};
          for (const issue of e.issues) {
            const path = issue.path
              ? issue.path
                  .map((p: { key: string }) => camelCase(p.key))
                  .join(".")
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
    });

    if ("error" in result) {
      return {
        errors: {
          _form: [result.error],
        },
        formData: { name, nameHiragana, sex, dateOfBirth },
      };
    }

    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "予期しないエラーが発生しました",
        ],
      },
      formData: { name, nameHiragana, sex, dateOfBirth },
    };
  }
}
