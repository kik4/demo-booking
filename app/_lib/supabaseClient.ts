import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "invalid";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "invalid";

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);
