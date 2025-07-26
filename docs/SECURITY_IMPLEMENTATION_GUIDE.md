# セキュリティ実装ガイド

このガイドは、SECURITY_ROADMAP.mdで定義された各フェーズの具体的な実装手順を提供します。

## 🚀 フェーズ1: 即座実装ガイド ✅ **完了: 2025-07-26**

### 1.1 セキュリティヘッダー実装 ✅ **完了: 2025-07-26**

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

### 1.2 JWT有効期限短縮 ✅ **完了: 2025-07-26**

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

### 1.3 基本CSP実装 ✅ **完了: 2025-07-26**

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

## 🛠️ フェーズ2: 短期実装ガイド ✅ **フェーズ2.1完了: 2025-07-26**

### 2.1 HTMLサニタイゼーション & ログインジェクション対策実装 ✅ **完了: 2025-07-26**

#### 実装アプローチの決定

**採用アプローチ**: Valibotバリデーション中心のXSS対策

**バリデーション vs サニタイゼーション比較**:

| 項目 | バリデーション（採用） | サニタイゼーション（不採用） |
|------|---------------------|---------------------------|
| **UX** | ✅ 明確なエラーメッセージ | ❌ 勝手に文字が消える |
| **透明性** | ✅ ユーザーが問題を理解 | ❌ 何が削除されたか不明 |
| **セキュリティ** | ✅ 攻撃を事前に阻止 | ✅ 攻撃を無害化 |
| **実装複雑度** | ✅ Valibotスキーマで簡潔 | ❌ DOMPurify設定が複雑 |
| **デバッグ性** | ✅ 問題箇所が明確 | ❌ サニタイゼーション後の検証が困難 |

**実装理由**: 
- **ユーザビリティ重視**: HTMLタグが勝手に消えることを防止
- **開発効率**: Valibotスキーマの正規表現1行で実装可能
- **保守性**: 一箇所でセキュリティルールを管理

#### ステップ1: セキュリティライブラリ作成

**ファイル**: `lib/sanitize.ts`

```typescript
/**
 * ログインジェクション対策
 * 改行文字、制御文字を削除してログの整合性を保つ
 */
export function sanitizeForLog(input: string): string {
  return (
    input
      .replace(/[\r\n\t]/g, " ") // 改行・タブを空白に変換
      .replace(/[\u0000-\u001f]/g, "") // 制御文字除去
      .replace(/[\u007f-\u009f]/g, "") // 拡張制御文字除去
      .substring(0, 200) // 長さ制限（ログの肥大化防止）
      .trim()
  );
}

/**
 * 危険なパターンの検出
 * サニタイゼーション前に攻撃パターンを検出してログに記録
 */
export function detectSuspiciousInput(input: string): {
  isSuspicious: boolean;
  patterns: string[];
} {
  const suspiciousPatterns = [
    { name: "script_tag", regex: /<script\b/i },
    { name: "javascript_url", regex: /javascript:/i },
    { name: "event_handler", regex: /on\w+\s*=/i },
    { name: "data_url", regex: /data:/i },
    { name: "style_expression", regex: /expression\s*\(/i },
    { name: "vbscript", regex: /vbscript:/i },
    { name: "log_injection", regex: /[\r\n].*\[(?:ERROR|WARN|INFO|DEBUG)\]/i },
  ];

  const detectedPatterns: string[] = [];

  for (const pattern of suspiciousPatterns) {
    if (pattern.regex.test(input)) {
      detectedPatterns.push(pattern.name);
    }
  }

  return {
    isSuspicious: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  };
}

/**
 * 安全なログ出力ユーティリティ
 * 44箇所のconsole使用を統一
 */
export const safeLog = {
  error: (message: string, data?: unknown) => {
    const safeData = sanitizeLogData(data);
    console.error(message, safeData);
  },
  warn: (message: string, data?: unknown) => {
    const safeData = sanitizeLogData(data);
    console.warn(message, safeData);
  },
  info: (message: string, data?: unknown) => {
    console.info(message, data);
  },
} as const;
```

#### ステップ2: Valibotスキーマにセキュリティ検証追加

**booking/_lib/bookingFormSchema.ts**の更新:

```typescript
import * as v from "valibot";

export const bookingFormSchema = v.object({
  // ... 他のフィールド
  notes: v.pipe(
    v.string(),
    v.maxLength(500, "補足は500文字以内で入力してください"),
    v.regex(/^[^<>]*$/, "HTMLタグは使用できません"), // HTMLタグ検証
  ),
});
```

**profile/_schemas/profileSchema.ts**の更新:

```typescript
export const profileFormSchema = v.object({
  name: v.pipe(
    v.string("名前は有効な値を入力してください"),
    v.trim(),
    v.minLength(2, "名前は2文字以上で入力してください"),
    v.maxLength(100, "名前は100文字以内で入力してください"),
    v.regex(/^[^<>]*$/, "HTMLタグは使用できません"), // HTMLタグ検証
    v.regex(/^[\p{L}\p{N}\s\-.]+$/u, "文字、数字、スペース、ハイフン、ドットのみ使用できます"), // 文字種制限
  ),
  // ... 他のフィールド
});
```

#### ステップ3: Server ActionsでsafeLog使用

**全Server Actions（44箇所）**でconsole.error/warn/logをsafeLogに置換:

```typescript
import { safeLog } from "@/lib/sanitize";

export async function createBookingAction(formData: FormData) {
  try {
    // ... 処理
  } catch (error) {
    // console.error → safeLog.error
    safeLog.error("Booking creation failed:", error);
    throw error;
  }
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

### フェーズ2.1 検証 ✅ **完了: 2025-07-26**

#### 包括的セキュリティテスト（19件のテストケース）

**ファイル**: `lib/__tests__/sanitize.test.ts`

```typescript
import { describe, expect, it } from 'vitest';
import { sanitizeForLog, detectSuspiciousInput, safeLog } from '../sanitize';

describe('Log Injection Protection', () => {
  it('should remove newlines and control characters', () => {
    const malicious = 'User input\n[ERROR] Fake log entry\r\nAnother line';
    const result = sanitizeForLog(malicious);
    expect(result).not.toContain('\n');
    expect(result).not.toContain('\r');
  });

  it('should detect XSS patterns', () => {
    const xssInput = '<script>alert("xss")</script>';
    const result = detectSuspiciousInput(xssInput);
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain('script_tag');
  });

  it('should detect log injection patterns', () => {
    const logInjection = 'user input\n[ERROR] Fake error message';
    const result = detectSuspiciousInput(logInjection);
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain('log_injection');
  });
});

describe('SafeLog Functionality', () => {
  it('should sanitize error data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorData = { message: 'Error\nwith\nnewlines' };
    
    safeLog.error('Test error:', errorData);
    
    expect(spy).toHaveBeenCalledWith('Test error:', 
      expect.objectContaining({
        message: expect.not.stringContaining('\n')
      })
    );
    spy.mockRestore();
  });
});
```

#### Valibotバリデーションテスト

**Server Actions統合テスト**でHTMLタグ入力がバリデーションエラーになることを確認:

```bash
# テスト実行
pnpm test:run

# 期待結果: 369/369 tests passed
# すべてのセキュリティテストが成功
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

## 📊 実装記録

### フェーズ1実装詳細
- **実装日**: 2025-07-26
- **実装者**: Claude Code assisted implementation
- **実装ファイル**:
  - `next.config.ts`: セキュリティヘッダー・CSP設定
  - `supabase/config.toml`: JWT有効期限設定
  - `scripts/check-headers.sh`: ヘッダー検証スクリプト

### フェーズ2.1実装詳細 ✅ **完了: 2025-07-26**
- **実装日**: 2025-07-26
- **実装ファイル**:
  - `lib/sanitize.ts`: ログインジェクション対策・safeLogユーティリティ
  - `app/(authenticated)/booking/_lib/bookingFormSchema.ts`: HTMLタグ検証
  - `app/(authenticated)/profile/_schemas/profileSchema.ts`: 文字種制限・HTMLタグ検証
  - `lib/__tests__/sanitize.test.ts`: 19件の包括的セキュリティテスト
  - 44箇所のServer Actions: console → safeLog統一

### 実装上の重要決定
1. **バリデーション優先アプローチ**: DOMPurifyによる自動サニタイゼーションではなく、Valibotバリデーションによる明示的エラー表示を採用
2. **ユーザビリティ重視**: HTMLタグが勝手に消えることを防止し、明確なエラーメッセージを提供
3. **ログ統一**: 44箇所のconsole使用をsafeLogで統一し、ログインジェクション攻撃を防止

### トラブルシューティング事例
- **CSP 'unsafe-eval' エラー**: Next.js runtime要件のため追加
- **Supabase認証エラー**: 開発環境用connect-src設定で解決
- **テスト失敗**: safeLogフォーマット変更に伴うテストケース更新（16件のテスト修正）

---

このガイドに従って実装することで、段階的かつ確実にセキュリティを強化できます。