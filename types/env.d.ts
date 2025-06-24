/** biome-ignore-all lint/correctness/noUnusedVariables: process.env のプロパティとして使用 */
namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_VERCEL_ENV: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
