# CLAUDE.md

このファイルは、このリポジトリでClaude Code (claude.ai/code) が作業する際のガイダンスを提供します。

## 開発コマンド

### 基本開発
- `pnpm dev` - TurbopackでNext.js開発サーバーを起動
- `pnpm build` - プロダクション用にアプリケーションをビルド
- `pnpm start` - プロダクションサーバーを起動

### コード品質
- `pnpm format` - Biomeでコードフォーマット（リンティング・自動修正含む）
- `pnpm type:check` - ファイル出力なしでTypeScript型チェック実行

### テスト
- `pnpm test` - ウォッチモードでテスト実行
- `pnpm test:run` - 全テストを一度実行
- `pnpm test:ui` - Vitest UIインターフェースでテスト実行

### Supabaseデータベース
- `pnpm supabase:start` - ローカルSupabaseインスタンスを起動
- `pnpm supabase:stop` - ローカルSupabaseインスタンスを停止
- `pnpm supabase:reset` - ローカルデータベースを最新マイグレーションにリセット
- `pnpm supabase:type` - SupabaseスキーマからTypeScript型を生成
- `pnpm supabase:sample` - データベースにサンプルデータを投入

## アーキテクチャ概要

### データベース・認証
これは行レベルセキュリティ（RLS）をコアセキュリティモデルとするSupabase駆動アプリケーションです：

- **Profilesテーブル**: ソフトデリート対応（`deleted_at`カラム）のメインユーザーデータテーブル
- **RLSポリシー**: `auth.uid()`と`user_id`の一致に基づき、ユーザーは自分のデータのみアクセス可能
- **ソフトデリートロジック**: RLSポリシーは`deleted_at` IS NOT NULLのレコードを除外
- **マルチクライアントアーキテクチャ**: 認証ユーザー、匿名アクセス、サービスロール操作用の別々のクライアント

### Supabaseクライアント管理
- `app/lib/supabaseClient.ts` - ブラウザ・アプリ使用向けメインクライアント
- `test/lib/supabaseTestClient.ts` - ユーザー作成・クリーンアップユーティリティ付き複合テストクライアントマネージャー
- サービスロールクライアントは管理操作でRLSをバイパス

### テスト戦略
- 統合テストはRLSポリシー検証に重点を置く
- `MultiClientManager`クラスが並列テストユーザー作成・クリーンアップを処理
- テストはユーザー間のデータ分離と適切なソフトデリート動作を検証
- 環境設定でSupabase GoTrueClient複数インスタンス警告を抑制

### コンポーネント構造  
- レイアウトベースルーティングのApp Routerアーキテクチャ
- 再利用可能UIエレメント用の`app/_components/`内コンポーネント
- 開発ログインボタン付きSupabase Authによる認証処理
- `types/database.types.ts`の生成型を使用した型安全データベース操作

### 主要設定ファイル
- `biome.json` - コードフォーマット・リンティング（ダブルクォート、ソート済みクラス）
- `vitest.config.ts` - jsdomとグローバルテストユーティリティでのテスト環境設定
- `test/setup.ts` - Next.js env読み込み付きテスト環境設定

### 開発ワークフロー
1. ローカルSupabaseを起動: `pnpm supabase:start`
2. スキーマ変更後に型を生成: `pnpm supabase:type`
3. コミット前に型チェック実行: `pnpm type:check`
4. データベース変更後に統合テストでRLSポリシーを検証
5. コードを自動フォーマット: `pnpm format`

### セキュリティ考慮事項
- 全データベース操作はRLSポリシーを遵守する必要がある
- テストユーザー管理・管理操作にはサービスロールキーが必要
- 認証状態はuser_id外部キーでSupabase Authによって管理
- ソフトデリート実装により偶発的なデータ漏洩を防止