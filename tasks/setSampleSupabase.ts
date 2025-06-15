import "./utils/envConfig";
import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resAuthUser = await supabaseClient.auth.admin.createUser({
  email: "user@example.com",
  password: "password",
  email_confirm: true,
});
if (resAuthUser.error) {
  console.error(resAuthUser);
  throw resAuthUser.error;
}

const resUser = await supabaseClient
  .from("users")
  .insert({ id: "user", user_id: resAuthUser.data.user?.id });
if (resUser.error) {
  console.error(resUser);
  throw resUser.error;
}
