"use server";

import { requireUserAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/supabaseClientServer";

export async function getUserProfileAction(): Promise<
  | {
      profile: { name: string };
    }
  | { error: string }
> {
  const supabase = await createClient();

  return requireUserAuth(supabase, async (authResult) => {
    return { profile: { name: authResult.profile.name } };
  });
}
