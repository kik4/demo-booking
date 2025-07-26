import { headers } from "next/headers";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (ip: string) => string;
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (本番環境ではRedisを推奨)
const rateLimitStore = new Map<string, RateLimitData>();

// Export for testing
export { rateLimitStore };

// テスト環境でのheaders()モック用フラグ
let isTestEnvironment = false;
let mockHeadersValue: { get: (key: string) => string | null } | null = null;

export function setTestEnvironment(
  enabled: boolean,
  mockHeaders?: { get: (key: string) => string | null },
) {
  isTestEnvironment = enabled;
  mockHeadersValue = mockHeaders || null;
}

// headers関数のラッパー
async function getHeaders() {
  if (isTestEnvironment && mockHeadersValue) {
    return mockHeadersValue;
  }
  return await headers();
}

/**
 * Server Action用レート制限ヘルパー
 */
export async function withRateLimit<T>(
  config: RateLimitConfig,
  action: () => Promise<T>,
): Promise<T | { error: string; rateLimited: true }> {
  const headersList = await getHeaders();
  const forwarded = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIP || "127.0.0.1";

  const key = config.keyGenerator
    ? config.keyGenerator(ip)
    : `rate_limit:${ip}`;
  const now = Date.now();
  const data = rateLimitStore.get(key);

  // ウィンドウがリセットされた場合、またはデータが存在しない場合
  if (!data || now > data.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return action();
  }

  // レート制限に達した場合
  if (data.count >= config.maxRequests) {
    const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);
    return {
      error: `レート制限に達しました。${resetInSeconds}秒後に再試行してください。`,
      rateLimited: true,
    };
  }

  // カウントを増加
  data.count++;
  rateLimitStore.set(key, data);

  return action();
}

/**
 * ユーザー固有のレート制限
 */
export async function withUserRateLimit<T>(
  userId: string,
  config: RateLimitConfig,
  action: () => Promise<T>,
): Promise<T | { error: string; rateLimited: true }> {
  const key = `user_rate_limit:${userId}`;
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now > data.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return action();
  }

  if (data.count >= config.maxRequests) {
    const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);
    return {
      error: `ユーザーレート制限に達しました。${resetInSeconds}秒後に再試行してください。`,
      rateLimited: true,
    };
  }

  data.count++;
  rateLimitStore.set(key, data);

  return action();
}

/**
 * 定期的にメモリストアをクリーンアップ
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 1分ごとにクリーンアップ

/**
 * 予約作成用のレート制限設定
 */
export const BOOKING_RATE_LIMIT = {
  maxRequests: 5, // 5分間に5回まで
  windowMs: 5 * 60 * 1000, // 5分
};

/**
 * プロフィール更新用のレート制限設定
 */
export const PROFILE_UPDATE_RATE_LIMIT = {
  maxRequests: 3, // 5分間に3回まで
  windowMs: 5 * 60 * 1000, // 5分
};

/**
 * 一般的なServer Action用のレート制限設定
 */
export const DEFAULT_RATE_LIMIT = {
  maxRequests: 30, // 5分間に30回まで
  windowMs: 5 * 60 * 1000, // 5分
};
