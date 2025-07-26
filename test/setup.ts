import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom";

// env の読み込み
loadEnvConfig(process.cwd());

// TZ の変更
process.env.TZ = "UTC"; // JST (UTC+0900), EST (UTC-0500) , NST (UTC+1200), SST(UTC-1100)

// レート制限のテスト環境設定
import { rateLimitStore, setTestEnvironment } from "../lib/rateLimit";

// 全テストでレート制限のテスト環境を有効にする
setTestEnvironment(true, {
  get: (key: string) => {
    if (key === "x-forwarded-for") return "127.0.0.1";
    if (key === "x-real-ip") return null;
    return null;
  },
});

// 各テスト前にレート制限ストアをクリア（全テスト共通）
beforeEach(() => {
  rateLimitStore.clear();
});
