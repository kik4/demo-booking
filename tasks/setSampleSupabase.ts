import "./utils/envConfig";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// user 登録だけのユーザー
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "new@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }
}

// プロフィール登録をしたユーザー
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "user@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }

  const resProfile = await supabaseClient
    .from("profiles")
    .insert({ name: "テスト太郎", user_id: user.data.user.id });
  if (resProfile.error) {
    console.error(resProfile);
    throw resProfile.error;
  }
}
