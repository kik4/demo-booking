"use server";

import { camelCase } from "lodash-es";
import * as v from "valibot";
import type { SexCode } from "@/constants/sexCode";
import { requireUserAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/db/profiles";
import { PROFILE_UPDATE_RATE_LIMIT, withUserRateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import { profileFormSchema } from "../../_schemas/profileSchema";

export interface EditProfileFormState {
  errors?: {
    name?: string[];
    nameHiragana?: string[];
    sex?: string[];
    dateOfBirth?: string[];
    root?: string[];
  };
  success?: boolean;
  error?: string;
  rateLimited?: true;
}

export async function editProfileAction(
  _prevState: EditProfileFormState,
  formData: FormData,
): Promise<EditProfileFormState> {
  const rawData = {
    name: formData.get("name") as string,
    nameHiragana: formData.get("nameHiragana") as string,
    sex: formData.get("sex") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
  };

  // Client-side validation
  const validationResult = v.safeParse(profileFormSchema, rawData);
  if (!validationResult.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of validationResult.issues) {
      const path = issue.path
        ? issue.path.map((p) => String(p.key)).join(".")
        : "root";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return {
      errors,
    };
  }

  const { name, nameHiragana, sex, dateOfBirth } = validationResult.output;

  try {
    const supabase = await createClient();

    const result = await requireUserAuth(supabase, async (authResult) => {
      return withUserRateLimit(
        authResult.user.id,
        PROFILE_UPDATE_RATE_LIMIT,
        async () => {
          // プロフィールを更新
          try {
            await updateProfile(
              authResult.user,
              {
                name,
                name_hiragana: nameHiragana,
                sex: Number(sex) as SexCode,
                date_of_birth: dateOfBirth,
              },
              supabase,
            );
            return { success: true };
          } catch (e) {
            if (e instanceof v.ValiError) {
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
              };
            }
            throw e;
          }
        },
      );
    });

    if ("error" in result) {
      return {
        errors: {
          root: [result.error],
        },
      };
    }

    return result;
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        root: [
          error instanceof Error
            ? error.message
            : "予期しないエラーが発生しました",
        ],
      },
    };
  }
}
