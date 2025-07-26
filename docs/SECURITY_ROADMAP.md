# セキュリティ強化ロードマップ

このドキュメントは、demo-bookingアプリケーションのセキュリティ強化に向けた実装ロードマップを提供します。

## 📊 現在のセキュリティ状況

### ✅ 実装済み（強固な基盤）

| 項目 | 説明 | 実装日 |
|------|------|--------|
| **CSRF基本保護** | Next.js 15 Server Actions自動保護 | 基盤 |
| **データベース保護** | Supabase RLS（行レベルセキュリティ） | 基盤 |
| **レート制限システム** | IP・ユーザー別制限、テスト完備 | 2025-01-26 |
| **認証・認可** | Supabase Auth + ロールベースアクセス | 基盤 |
| **セキュリティヘッダー** | 包括的セキュリティヘッダー設定 | 2025-01-26 |
| **JWT セッション管理** | 15分有効期限、トークン自動更新 | 2025-01-26 |
| **基本CSP保護** | Content Security Policy実装 | 2025-01-26 |

### ⚠️ 改善対象項目

| 項目 | 現在の状態 | リスクレベル |
|------|------------|--------------|
| HTMLサニタイゼーション | 基本valibot検証のみ | 低 |
| 監査ログ機能 | 未実装 | 中 |
| 完全CSP（Nonce） | 基本CSP設定済み | 低 |
| WAF統合 | 未実装 | 中 |

## 🛣️ 実装フェーズ

## フェーズ1: 即座実装（1-2日）⚡ ✅ **完了: 2025-01-26**

### 優先度: 🔴 最高 - **実装完了**

#### 1.1 セキュリティヘッダー追加

**実装ファイル**: `next.config.ts`

```typescript
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
```

**効果**:
- クリックジャッキング攻撃防止
- MIME sniffing攻撃防止  
- XSS攻撃軽減
- HTTPS強制

**検証方法**:
```bash
curl -I https://yourdomain.com | grep -E "(X-Frame|X-Content|Referrer)"
```

#### 1.2 JWT有効期限短縮

**実装ファイル**: `supabase/config.toml`

```toml
[auth]
jwt_expiry = 900  # 15分（現在: 3600秒）
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 5  # 5秒（現在: 10秒）
```

**効果**:
- セッション固定攻撃リスク軽減
- トークン盗用時の影響最小化

**検証方法**:
```bash
# ローカル確認
supabase status
# トークン有効期限確認
```

#### 1.3 基本CSP設定

**実装**: next.config.tsに追加

```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // 段階的に'unsafe-inline'削除予定
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.supabase.co",
  ].join('; '),
},
```

**検証方法**:
- ブラウザ開発ツールでCSPエラー確認
- 全ページの正常動作確認

---

## フェーズ2: 短期実装（1週間）🟡

### 優先度: 🟡 高

#### 2.1 HTMLサニタイゼーション

**依存関係追加**:
```bash
pnpm add isomorphic-dompurify
pnpm add -D @types/dompurify
```

**実装例**: `lib/sanitize.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // HTMLタグ無効
    ALLOWED_ATTR: [], // 属性無効
  });
}

export function sanitizeUserInput(input: string): string {
  // 基本的なサニタイゼーション
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
```

**適用箇所**:
- `createBookingAction.ts`: notesフィールド
- `editProfileAction.ts`: 全テキストフィールド

#### 2.2 監査ログ機能

**実装**: `lib/auditLog.ts`

```typescript
interface SecurityEvent {
  event: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function logSecurityEvent(eventData: Omit<SecurityEvent, 'timestamp'>) {
  const event: SecurityEvent = {
    ...eventData,
    timestamp: new Date(),
  };

  // 開発環境
  console.log('[SECURITY]', JSON.stringify(event, null, 2));
  
  // 本番環境では外部サービス（Sentry等）に送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービス連携
  }
}

// 使用例
export const SecurityEvents = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_LOGIN_ATTEMPT: 'INVALID_LOGIN_ATTEMPT',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const;
```

#### 2.3 HTTPS強制リダイレクト

**実装**: next.config.tsに追加

```typescript
async redirects() {
  return [
    {
      source: '/(.*)',
      has: [
        {
          type: 'header',
          key: 'x-forwarded-proto',
          value: 'http',
        },
      ],
      destination: 'https://yourdomain.com/$1',
      permanent: true,
    },
  ];
},
```

---

## フェーズ3: 中期実装（1-2週間）🟠

### 優先度: 🟠 中

#### 3.1 完全CSP実装

**段階的アプローチ**:

1. **Nonce生成機能**

```typescript
// lib/csp.ts
import { randomBytes } from 'crypto';

export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

// middleware.tsでNonce設定
export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();
  
  response.headers.set('x-nonce', nonce);
  return response;
}
```

2. **厳格CSP設定**

```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'none'",
    "script-src 'self' 'nonce-{NONCE}'",
    "style-src 'self' 'nonce-{NONCE}'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://api.supabase.co",
    "form-action 'self'",
  ].join('; '),
},
```

#### 3.2 Redis移行（Upstash）

**設定手順**:

1. **Upstashアカウント作成**
2. **環境変数追加**

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

3. **実装**: `lib/rateLimit.ts`更新

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function withRateLimitRedis<T>(
  config: RateLimitConfig,
  action: () => Promise<T>,
): Promise<T | { error: string; rateLimited: true }> {
  const key = `rate_limit:${ip}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  
  if (count > config.maxRequests) {
    const ttl = await redis.ttl(key);
    return {
      error: `レート制限に達しました。${ttl}秒後に再試行してください。`,
      rateLimited: true,
    };
  }
  
  return action();
}
```

#### 3.3 外部ログサービス統合

**Sentry統合例**:

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// lib/auditLog.ts更新
export function logSecurityEvent(eventData: SecurityEvent) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message: eventData.event,
      level: 'warning',
      data: eventData.metadata,
    });
  }
}
```

---

## フェーズ4: 長期実装（1ヶ月）🟢

### 優先度: 🟢 低

#### 4.1 WAF（Web Application Firewall）導入

**Cloudflare設定**:
- Bot Fight Mode有効化
- Rate Limiting Rules設定
- Custom Rules for API保護

**AWS WAF設定例**:
```json
{
  "Rules": [
    {
      "Name": "SQLInjectionRule",
      "Priority": 1,
      "Statement": {
        "SqliMatchStatement": {
          "FieldToMatch": {
            "Body": {}
          }
        }
      },
      "Action": {
        "Block": {}
      }
    }
  ]
}
```

#### 4.2 侵入検知システム

**実装**: `lib/intrusion-detection.ts`

```typescript
interface SuspiciousActivity {
  userId?: string;
  ip: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
}

export class IntrusionDetector {
  private suspiciousActivities = new Map<string, SuspiciousActivity>();
  
  async detectSuspiciousActivity(
    ip: string,
    pattern: string,
    userId?: string
  ): Promise<void> {
    const key = `${ip}:${pattern}`;
    const activity = this.suspiciousActivities.get(key);
    
    if (activity) {
      activity.count++;
      if (activity.count > 10) {
        await this.triggerAlert(activity);
      }
    } else {
      this.suspiciousActivities.set(key, {
        userId,
        ip,
        pattern,
        severity: 'low',
        count: 1,
      });
    }
  }
  
  private async triggerAlert(activity: SuspiciousActivity): Promise<void> {
    // Slack/Discord/Email通知
    console.log('🚨 SECURITY ALERT:', activity);
  }
}
```

#### 4.3 定期セキュリティ監査

**自動化スクリプト**: `scripts/security-audit.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function runSecurityAudit(): Promise<void> {
  console.log('🔍 セキュリティ監査開始...');
  
  try {
    // 依存関係脆弱性チェック
    await execPromise('pnpm audit');
    
    // TypeScript型チェック
    await execPromise('pnpm type:check');
    
    // テスト実行
    await execPromise('pnpm test:run');
    
    // セキュリティヘッダーチェック
    const { stdout } = await execPromise('curl -I https://localhost:3000');
    console.log('セキュリティヘッダー:', stdout);
    
    console.log('✅ セキュリティ監査完了');
  } catch (error) {
    console.error('❌ セキュリティ監査失敗:', error);
    process.exit(1);
  }
}
```

---

## 📋 実装チェックリスト

### フェーズ1 チェックリスト ✅ **完了**
- [x] セキュリティヘッダー設定完了
- [x] JWT有効期限短縮設定
- [x] 基本CSP設定
- [x] 本番環境でのヘッダー確認
- [x] 全ページの動作確認

### フェーズ2 チェックリスト  
- [ ] DOMPurifyライブラリ追加
- [ ] サニタイゼーション関数実装
- [ ] 監査ログ機能実装
- [ ] HTTPS強制リダイレクト設定
- [ ] セキュリティイベントのログ確認

### フェーズ3 チェックリスト
- [ ] Nonce生成機能実装
- [ ] 厳格CSP設定
- [ ] UpstashRedis設定
- [ ] レート制限Redis移行
- [ ] Sentry連携設定

### フェーズ4 チェックリスト
- [ ] WAF設定
- [ ] 侵入検知システム実装
- [ ] 自動監査スクリプト作成
- [ ] アラート通知設定
- [ ] 定期実行設定（CI/CD）

## 🎯 成功指標

| フェーズ | 指標 | 目標値 | 実装状況 |
|----------|------|--------|----------|
| 1 | セキュリティヘッダー設定率 | 100% | ✅ **達成** |
| 1 | セッション時間短縮 | 15分以下 | ✅ **達成** (15分) |
| 2 | XSS脆弱性 | 0件 | 🔄 **進行中** |
| 2 | 監査ログ記録率 | 100% | ⏳ **未実装** |
| 3 | CSP違反 | 0件 | ✅ **達成** |
| 3 | Redis応答時間 | <100ms | ⏳ **未実装** |
| 4 | 自動検知率 | >95% | ⏳ **未実装** |
| 4 | 監査実行頻度 | 週1回 | ⏳ **未実装** |

## 📞 サポート・質問

実装中に問題が発生した場合:

1. **技術的質問**: 開発チームSlack #security-channel
2. **緊急事態**: セキュリティインシデント対応手順に従う
3. **定期レビュー**: 月次セキュリティ会議で進捗確認

---

---

## 📈 実装進捗

### 完了フェーズ
- ✅ **フェーズ1（即座実装）**: 2025年1月26日完了
  - セキュリティヘッダー、JWT有効期限短縮、基本CSP設定

### 次のステップ
- 🔄 **フェーズ2（短期実装）**: HTMLサニタイゼーション、監査ログ機能
- ⏳ **フェーズ3（中期実装）**: 完全CSP（Nonce）、Redis移行
- ⏳ **フェーズ4（長期実装）**: WAF導入、侵入検知システム

---

**最終更新**: 2025年1月26日  
**フェーズ1完了**: 2025年1月26日  
**次回レビュー**: 2025年2月26日