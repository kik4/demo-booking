# CLAUDE.md

このファイルは、このリポジトリのコードを操作する際のClaude Code (claude.ai/code) 向けガイダンスを提供します。

## 開発コマンド

### 基本開発
- `pnpm dev` - TurbopackでNext.js開発サーバーを起動
- `pnpm build` - 本番用アプリケーションビルド
- `pnpm start` - 本番サーバー起動

### コード品質
- `pnpm format` - Biomeでコードフォーマット・リント（自動修正込み）
- `pnpm type:check` - ファイル出力なしでTypeScript型チェック実行

### テスト
- `pnpm test` - ウォッチモードでテスト実行
- `pnpm test:run` - 全テストを一度だけ実行
- `pnpm test:watch` - ウォッチモードでテスト実行（代替コマンド）
- `pnpm test:ui` - Vitest UIインターフェースでテスト実行

### Supabaseデータベース
- `pnpm supabase:start` - ローカルSupabaseインスタンス起動
- `pnpm supabase:stop` - ローカルSupabaseインスタンス停止
- `pnpm supabase:reset` - 最新マイグレーションでローカルデータベースリセット
- `pnpm supabase:diff` - データベースマイグレーション差分生成
- `pnpm supabase:type` - SupabaseスキーマからTypeScript型を生成
- `pnpm supabase:test` - Supabaseデータベーステスト実行
- `pnpm supabase:sample` - サンプルデータでデータベースを初期化

## アーキテクチャ概要

### データベース & 認証
このアプリケーションはSupabase駆動で、Row Level Security (RLS) をコアセキュリティモデルとしています：

- **Profilesテーブル**: 論理削除対応（`deleted_at`カラム）のメインユーザーデータテーブル
- **Bookingsテーブル**: ユーザー関連付けとタイムスロット割り当てによる予約管理
- **RLSポリシー**: `auth.uid()`と`user_id`の一致に基づいてユーザーが自分のデータのみアクセス可能
- **論理削除ロジック**: RLSポリシーで`deleted_at` IS NOT NULLのレコードを除外
- **ロールベースアクセス**: ミドルウェアベースのルート保護によるAdminとUserロール

### Supabaseクライアント管理
- `lib/supabaseClient.ts` - ブラウザ/アプリ用途のメインクライアント
- `lib/supabaseClientServer.ts` - サーバーアクションとミドルウェア用のサーバーサイドクライアント
- サービスロールクライアントは管理操作のためRLSをバイパス

### 認証 & 認可
- **ミドルウェア**: `middleware.ts`がルート保護とロールベースリダイレクトを処理
- **Adminルート**: `/admin/*` - `role = "admin"`ユーザーのみアクセス可能
- **ユーザールート**: `/home/*`, `/profile/*`, `/booking/*`, `/bookings/*` - 認証済みユーザー向け
- **登録フロー**: 新規ユーザーはプロフィール登録を完了する必要がある

### テスト戦略
- **ユニットテスト**: ユーティリティとコンポーネント用にjsdom環境でVitest
- **データベーステスト**: `supabase/tests/database/`でpgTAPフレームワークを使用したSQLベーステスト
- **セキュリティテスト**: `lib/__tests__/sanitize.test.ts`でログインジェクション対策の包括的テスト
- **統合テスト**: Server ActionsとサニタイゼーションのE2Eテストカバレッジ

### コンポーネント構造
- レイアウトベースルーティングのApp Routerアーキテクチャ
- グローバル再利用可能UIエレメント用の`app/_components/`コンポーネント
- 各ルートディレクトリ内の機能固有コンポーネント（例：`booking/_components/`）
- 開発ログインボタンによる認証処理
- 日時選択、サービス選択、確認を含む予約システム
- `types/database.types.ts`の生成型による型安全なデータベース操作

### 管理画面機能
- **予約一覧管理** (`/admin/bookings`)
  - ソート可能な予約一覧テーブル（ID、予約者、サービス名、日時、備考、登録日時）
  - 削除された予約のフィルタリング機能（`BookingSearchForm`コンポーネント）
  - 削除予約の視覚的区別（薄い赤背景、削除済みバッジ、削除日時表示）
  - URLパラメータによる状態管理（`includeDeleted`）
- **ユーザー管理** (`/admin/users`) - ユーザー一覧と管理操作
- **サービス管理** (`/admin/services`) - サービスの作成、編集、削除

### セキュリティライブラリ & ユーティリティ
- **`lib/sanitize.ts`**: ログインジェクション対策とセキュアログ管理
  - `sanitizeForLog()`: 改行文字・制御文字の除去とログの整合性保護
  - `detectSuspiciousInput()`: XSS攻撃パターンの検出とログ記録
  - `safeLog`: エラー・警告・情報ログの統一インターフェース
- **Valibotスキーマ**: HTMLタグ検証と文字種制限による入力値バリデーション
- **エラーハンドリング**: バリデーション優先でユーザー体験を重視したアプローチ

### 主要設定ファイル
- `biome.json` - コードフォーマットとリント（ダブルクォート、ソート済みクラス）
- `vitest.config.ts` - jsdomとグローバルユーティリティでのテスト環境設定
- `test/setup.ts` - Next.js env読み込みでのテスト環境設定
- `middleware.ts` - ルート保護とロールベースアクセス制御
- `next.config.ts` - Next.js設定
- `components.json` - shadcn/ui コンポーネント設定（checkbox、button、form等のUIライブラリ）
- `husky` + `lint-staged` - コード品質のためのプリコミットフック

### 開発ワークフロー
1. ローカルSupabase起動: `pnpm supabase:start`
2. スキーマ変更後の型生成: `pnpm supabase:type`
3. コミット前の型チェック: `pnpm type:check`
4. データベース変更後のRLSポリシー統合テスト検証
5. コード自動フォーマット: `pnpm format`
6. テスト実行: `pnpm test:run`
7. サンプルデータ投入: `pnpm supabase:sample`

### セキュリティ & ログ管理
- **RLSポリシー**: 全てのデータベース操作はRow Level Securityポリシーを尊重
- **論理削除**: 偶発的なデータ露出を防ぐ`deleted_at`による論理削除実装
- **XSS対策**: Valibotスキーマによる入力値検証（HTMLタグ、危険文字の検出）
- **ログインジェクション対策**: `lib/sanitize.ts`のsafeLogユーティリティによる統一ログ管理
- **入力値検証**: HTMLタグ除去ではなくバリデーションエラーによるUX重視アプローチ
- **セキュアログ**: 44箇所のconsole使用をsafeLog（error/warn/info）で統一
- **認証状態管理**: user_id外部キーによるSupabase Auth管理の認証状態
- **管理者権限**: サービスロールキーによるテストユーザー管理と管理操作