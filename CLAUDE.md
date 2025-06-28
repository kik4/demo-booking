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

### コンポーネント構造
- レイアウトベースルーティングのApp Routerアーキテクチャ
- グローバル再利用可能UIエレメント用の`app/_components/`コンポーネント
- 各ルートディレクトリ内の機能固有コンポーネント（例：`booking/_components/`）
- 開発ログインボタンによる認証処理
- 日時選択、サービス選択、確認を含む予約システム
- `types/database.types.ts`の生成型による型安全なデータベース操作

### 主要設定ファイル
- `biome.json` - コードフォーマットとリント（ダブルクォート、ソート済みクラス）
- `vitest.config.ts` - jsdomとグローバルユーティリティでのテスト環境設定
- `test/setup.ts` - Next.js env読み込みでのテスト環境設定
- `middleware.ts` - ルート保護とロールベースアクセス制御
- `next.config.ts` - Next.js設定
- `components.json` - shadcn/ui コンポーネント設定
- `husky` + `lint-staged` - コード品質のためのプリコミットフック

### 開発ワークフロー
1. ローカルSupabase起動: `pnpm supabase:start`
2. スキーマ変更後の型生成: `pnpm supabase:type`
3. コミット前の型チェック: `pnpm type:check`
4. データベース変更後のRLSポリシー統合テスト検証
5. コード自動フォーマット: `pnpm format`
6. テスト実行: `pnpm test:run`
7. サンプルデータ投入: `pnpm supabase:sample`

### セキュリティ考慮事項
- 全てのデータベース操作はRLSポリシーを尊重する必要がある
- テストユーザー管理と管理操作にはサービスロールキーが必要
- user_id外部キーによるSupabase Auth管理の認証状態
- 偶発的なデータ露出を防ぐ論理削除実装