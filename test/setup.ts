import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom";

// env の読み込み
loadEnvConfig(process.cwd());

// テスト環境でのSupabase GoTrueClient警告を抑制
const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  // GoTrueClientの複数インスタンス警告を抑制
  if (
    typeof args[0] === "string" &&
    args[0].includes("Multiple GoTrueClient instances detected")
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};
