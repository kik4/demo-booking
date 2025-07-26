# セキュリティ実装ガイド

このガイドは、SECURITY_ROADMAP.mdで定義された各フェーズの具体的な実装手順を提供します。

## 🚀 フェーズ1: 即座実装ガイド ✅ **完了: 2025-01-26**

### 1.1 セキュリティヘッダー実装 ✅ **完了: 2025-01-26**

#### ステップ1: next.config.tsの更新

```bash
# ファイルをバックアップ
cp next.config.ts next.config.ts.backup
```

**実装コード**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### ステップ2: 動作確認

```bash
# 開発サーバー再起動
pnpm dev

# 別ターミナルでヘッダー確認
curl -I http://localhost:3000
```

**期待される出力**:
```
HTTP/1.1 200 OK
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
```

### 1.2 JWT有効期限短縮 ✅ **完了: 2025-01-26**

#### ステップ1: supabase/config.tomlの更新

```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 900  # 15分に短縮（以前: 3600）
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 5  # 5秒に短縮（以前: 10）
```

#### ステップ2: ローカル環境再起動

```bash
# Supabaseローカル環境再起動
pnpm supabase:stop
pnpm supabase:start
```

#### ステップ3: 動作確認

```bash
# 設定確認
supabase status
```

### 1.3 基本CSP実装 ✅ **完了: 2025-01-26**

#### next.config.tsに追加

```typescript
// headers配列にCSPヘッダーを追加
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
  ].join('; '),
},
```

---

## 🛠️ フェーズ2: 短期実装ガイド

### 2.1 HTMLサニタイゼーション実装

#### ステップ1: 依存関係追加

```bash
pnpm add isomorphic-dompurify
pnpm add -D @types/dompurify
```

#### ステップ2: サニタイゼーション関数作成

**ファイル**: `lib/sanitize.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

/**
 * HTMLタグを完全に除去するサニタイゼーション
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * 基本的なXSS対策
 */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // onclickなどのイベントハンドラ削除
    .trim();
}

/**
 * バリデーション後のサニタイゼーション適用
 */
export function applySanitization<T extends Record<string, any>>(
  data: T,
  fieldsToSanitize: (keyof T)[]
): T {
  const sanitized = { ...data };
  
  for (const field of fieldsToSanitize) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  }
  
  return sanitized;
}
```

#### ステップ3: Server Actionsに適用

**createBookingAction.ts**の更新:

```typescript
import { applySanitization, sanitizeText } from "@/lib/sanitize";

export async function createBookingAction(
  formData: FormData,
): Promise<CreateBookingFormState> {
  return withRateLimit(BOOKING_RATE_LIMIT, async () => {
    const rawData = {
      serviceId: formData.get("serviceId") as string,
      serviceName: formData.get("serviceName") as string,
      servicePrice: formData.get("servicePrice") as string,
      serviceDuration: formData.get("serviceDuration") as string,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      notes: formData.get("notes") as string,
    };

    // サニタイゼーション適用
    const sanitizedData = applySanitization(rawData, ['notes', 'serviceName']);

    const result = v.safeParse(bookingFormSchema, sanitizedData);
    // ... 以降の処理
  });
}
```

### 2.2 監査ログ機能実装

#### ステップ1: 監査ログライブラリ作成

**ファイル**: `lib/auditLog.ts`

```typescript
import { headers } from 'next/headers';

export interface SecurityEvent {
  event: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const SecurityEvents = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_LOGIN_ATTEMPT: 'INVALID_LOGIN_ATTEMPT',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
} as const;

export async function logSecurityEvent(
  eventData: Omit<SecurityEvent, 'timestamp' | 'ip' | 'userAgent'>
): Promise<void> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIP || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";

    const event: SecurityEvent = {
      ...eventData,
      ip,
      userAgent,
      timestamp: new Date(),
    };

    // 開発環境でのログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 [SECURITY EVENT]', JSON.stringify(event, null, 2));
    }

    // 本番環境では外部サービスに送信
    if (process.env.NODE_ENV === 'production') {
      await sendToLogService(event);
    }

    // 重要度が高い場合は即座にアラート
    if (event.severity === 'critical' || event.severity === 'high') {
      await triggerAlert(event);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

async function sendToLogService(event: SecurityEvent): Promise<void> {
  // TODO: Sentry、DataDog、CloudWatch等への送信実装
  console.log('Sending to log service:', event.event);
}

async function triggerAlert(event: SecurityEvent): Promise<void> {
  // TODO: Slack、Discord、Email等への緊急通知実装
  console.log('🚨 SECURITY ALERT:', event.event);
}
```

#### ステップ2: レート制限機能に統合

**lib/rateLimit.ts**の更新:

```typescript
import { logSecurityEvent, SecurityEvents } from './auditLog';

export async function withRateLimit<T>(
  config: RateLimitConfig,
  action: () => Promise<T>,
): Promise<T | { error: string; rateLimited: true }> {
  // ... 既存のコード

  if (data.count >= config.maxRequests) {
    // セキュリティイベントをログ
    await logSecurityEvent({
      event: SecurityEvents.RATE_LIMIT_EXCEEDED,
      severity: 'medium',
      metadata: {
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        currentCount: data.count,
      },
    });

    const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);
    return {
      error: `レート制限に達しました。${resetInSeconds}秒後に再試行してください。`,
      rateLimited: true,
    };
  }

  // ... 残りのコード
}
```

---

## 📋 テスト・検証手順

### フェーズ1 検証

#### セキュリティヘッダーテスト

```bash
# ヘッダー確認スクリプト
cat > scripts/check-headers.sh << 'EOF'
#!/bin/bash
echo "🔍 セキュリティヘッダーチェック..."

HEADERS=(
  "X-Frame-Options"
  "X-Content-Type-Options"
  "Referrer-Policy"
  "X-XSS-Protection"
)

for header in "${HEADERS[@]}"; do
  value=$(curl -s -I http://localhost:3000 | grep -i "$header" | cut -d' ' -f2-)
  if [ -n "$value" ]; then
    echo "✅ $header: $value"
  else
    echo "❌ $header: 未設定"
  fi
done
EOF

chmod +x scripts/check-headers.sh
./scripts/check-headers.sh
```

#### CSPテスト

```bash
# CSP違反チェック用のテストページ作成
cat > pages/test-csp.tsx << 'EOF'
export default function TestCSP() {
  return (
    <div>
      <h1>CSPテストページ</h1>
      {/* これらは CSP に違反するため、ブロックされるべき */}
      <script>alert('inline script')</script>
      <div onClick="alert('click')" style="color: red;">クリック</div>
    </div>
  );
}
EOF
```

### フェーズ2 検証

#### サニタイゼーションテスト

```typescript
// lib/__tests__/sanitize.test.ts
import { describe, expect, it } from 'vitest';
import { sanitizeText, sanitizeUserInput, applySanitization } from '../sanitize';

describe('Sanitization', () => {
  it('should remove script tags', () => {
    const malicious = '<script>alert("xss")</script>Hello';
    const result = sanitizeText(malicious);
    expect(result).toBe('Hello');
  });

  it('should remove javascript: URLs', () => {
    const malicious = 'javascript:alert("xss")';
    const result = sanitizeUserInput(malicious);
    expect(result).not.toContain('javascript:');
  });

  it('should sanitize multiple fields', () => {
    const data = {
      safe: 'normal text',
      dangerous: '<script>alert("xss")</script>',
    };
    
    const result = applySanitization(data, ['dangerous']);
    expect(result.safe).toBe('normal text');
    expect(result.dangerous).toBe('');
  });
});
```

#### 監査ログテスト

```bash
# ログ出力確認
pnpm test:run
pnpm dev

# 別ターミナルで大量リクエスト送信
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/test-endpoint
done

# ログ出力を確認
```

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. CSP違反でページが動作しない

**症状**: ページが正常に表示されない、コンソールにCSPエラー

**解決策**:
```typescript
// 一時的にCSPを緩和
"script-src 'self' 'unsafe-inline' 'unsafe-eval'"

// 段階的に厳格化
"script-src 'self' 'unsafe-inline'"  // evalを削除
"script-src 'self'"                  // inline scriptを削除
```

#### 2. サニタイゼーションでデータが消える

**症状**: フォーム送信後にデータが空になる

**解決策**:
```typescript
// デバッグ用ログ追加
console.log('Before sanitization:', data);
const sanitized = sanitizeText(data);
console.log('After sanitization:', sanitized);
```

#### 3. 監査ログが出力されない

**症状**: セキュリティイベントがログに記録されない

**解決策**:
```typescript
// 環境変数確認
console.log('NODE_ENV:', process.env.NODE_ENV);

// try-catch追加
try {
  await logSecurityEvent({...});
} catch (error) {
  console.error('Log error:', error);
}
```

---

## 📊 パフォーマンス最適化

### セキュリティ機能の最適化

#### 1. サニタイゼーション最適化

```typescript
// キャッシュ機能付きサニタイゼーション
const sanitizeCache = new Map<string, string>();

export function cachedSanitize(input: string): string {
  if (sanitizeCache.has(input)) {
    return sanitizeCache.get(input)!;
  }
  
  const result = sanitizeText(input);
  
  // キャッシュサイズ制限
  if (sanitizeCache.size > 1000) {
    sanitizeCache.clear();
  }
  
  sanitizeCache.set(input, result);
  return result;
}
```

#### 2. ログ最適化

```typescript
// バッチログ送信
class LogBuffer {
  private buffer: SecurityEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // 5秒ごとにフラッシュ
  }

  add(event: SecurityEvent) {
    this.buffer.push(event);
    
    if (this.buffer.length >= 10) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;
    
    const events = [...this.buffer];
    this.buffer = [];
    
    try {
      await sendBatchToLogService(events);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // バックアップとしてローカルに保存
      this.buffer.unshift(...events);
    }
  }
}
```

---

## 📊 フェーズ1実装記録

### 実装詳細
- **実装日**: 2025年1月26日
- **実装者**: Claude Code assisted implementation
- **実装ファイル**:
  - `next.config.ts`: セキュリティヘッダー・CSP設定
  - `supabase/config.toml`: JWT有効期限設定
  - `scripts/check-headers.sh`: ヘッダー検証スクリプト

### 実装上の注意点
1. **CSP設定**: 開発環境では自動的にローカルSupabaseエンドポイントを許可
2. **JWT設定**: ローカルSupabaseインスタンスの再起動が必要
3. **検証**: 全セキュリティヘッダーの動作確認済み

### トラブルシューティング事例
- **CSP 'unsafe-eval' エラー**: Next.js runtime要件のため追加
- **Supabase認証エラー**: 開発環境用connect-src設定で解決

---

このガイドに従って実装することで、段階的かつ確実にセキュリティを強化できます。