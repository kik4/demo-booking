import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom";

// env の読み込み
loadEnvConfig(process.cwd());

// TZ の変更
process.env.TZ = "UTC"; // JST (UTC+0900), EST (UTC-0500)
