"use server";

import { camelCase } from "lodash-es";
import * as v from "valibot";
import { ROLE_CODES } from "@/constants/roleCode";
import type { SexCode } from "@/constants/sexCode";
import { requireAuth } from "@/lib/auth";
import { createProfile } from "@/lib/db/profiles";
import { safeLog } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import { profileFormSchema } from "../../profile/_schemas/profileSchema";

export interface RegisterFormState {
  errors?: {
    name?: string[];
    nameHiragana?: string[];
    sex?: string[];
    dateOfBirth?: string[];
    root?: string[];
  };
  success?: boolean;
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
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

    const result = await requireAuth(supabase, async (authResult) => {
      // プロフィールを作成
      try {
        await createProfile(
          authResult.user,
          {
            name,
            name_hiragana: nameHiragana,
            sex: Number(sex) as SexCode,
            date_of_birth: dateOfBirth,
            role: ROLE_CODES.USER,
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
    safeLog.error("Unexpected error:", error);
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
