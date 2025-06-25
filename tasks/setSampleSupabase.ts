import "./utils/envConfig";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// データベースリセット
console.log("Resetting database...");

// 既存のプロフィールデータを削除
const { error: profilesError } = await supabaseClient
  .from("profiles")
  .delete()
  .gt("id", 0);

if (profilesError) {
  console.error("Error deleting profiles:", profilesError);
  throw profilesError;
}

// 既存のテストユーザーを削除
const { data: existingUsers, error: listError } =
  await supabaseClient.auth.admin.listUsers();
if (listError) {
  console.error("Error listing users:", listError);
  throw listError;
}

for (const user of existingUsers.users) {
  if (user.email === "new@example.com" || user.email === "user@example.com") {
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(
      user.id,
    );
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }
  }
}

console.log("Database reset completed. Inserting sample data...");

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

  const resProfile = await supabaseClient.from("profiles").insert({
    name: "テスト太郎",
    name_hiragana: "てすとたろう",
    sex: 1,
    date_of_birth: "1990-01-01",
    user_id: user.data.user.id,
  });
  if (resProfile.error) {
    console.error(resProfile);
    throw resProfile.error;
  }
}

console.log("Sample data insertion completed successfully!");
