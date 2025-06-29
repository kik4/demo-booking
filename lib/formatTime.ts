import { normalizeDateTime } from "./normalizeDateTime";

/**
 * 日付文字列を「HH:MM」形式の時刻文字列に変換する
 *
 * @param dateString - ISO 8601形式の日付文字列（例: "2024-06-29T10:30:00.000Z"）、supabase の timestamp UTC も可
 * @returns 24時間形式の時刻文字列（例: "19:30"）
 *
 * @example
 * ```typescript
 * formatTime("2024-06-29T10:30:00.000Z")
 * // => "19:30" (JST表示)
 *
 * formatTime("2024-06-29T00:00:00.000Z")
 * // => "09:00" (JST表示)
 * ```
 *
 * @throws {Error} 無効な日付形式の場合はnormalizeDateTimeがエラーをスロー
 *
 * @remarks
 * - 入力された日付文字列はnormalizeDateTimeで正規化される
 * - タイムゾーンはAsia/Tokyo（JST）で表示される
 * - 24時間形式で時刻を表示する
 * - 日本語ロケール（ja-JP）を使用してフォーマットする
 */
export const formatTime = (dateString: string) => {
  const date = new Date(normalizeDateTime(dateString));

  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
};
