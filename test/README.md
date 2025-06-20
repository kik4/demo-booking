# テスト環境について

このプロジェクトではVitestを使用してテストを実行しています。

## セットアップ済みの内容

### 依存関係
- `vitest` - テストランナー
- `@vitejs/plugin-react` - React用のViteプラグイン
- `jsdom` - DOM環境のシミュレーション
- `@testing-library/react` - Reactコンポーネントのテスト
- `@testing-library/jest-dom` - DOM要素のマッチャー
- `@testing-library/user-event` - ユーザーインタラクションのシミュレーション

### 設定ファイル
- `vitest.config.ts` - Vitestの設定
- `test/setup.ts` - テストのセットアップファイル
- `test/vitest.d.ts` - Vitestの型定義

### テストスクリプト
- `pnpm test` - テストをwatch モードで実行
- `pnpm test:run` - テストを一度だけ実行
- `pnpm test:watch` - テストをwatch モードで実行
- `pnpm test:ui` - テストUIを起動

## テストファイルの場所

テストファイルは以下の場所に配置してください：

- コンポーネントのテスト: `app/_components/__tests__/`
- ユーティリティ関数のテスト: `app/lib/__tests__/`
- その他のテスト: 対応するディレクトリ内の `__tests__/` フォルダ

## テストの実行

```bash
# 全てのテストを実行
pnpm test:run

# watch モードでテストを実行
pnpm test

# テストUIを起動
pnpm test:ui
```

## モックについて

Supabaseクライアントなどの外部依存関係は、各テストファイル内で`vi.mock()`を使用してモック化しています。

## 既存のテスト例

- `app/lib/__tests__/utils.test.ts` - ユーティリティ関数のテスト例
- `app/_components/__tests__/UserInfo.test.tsx` - Reactコンポーネントのテスト例
