import { normalizeDateTime } from "./normalizeDateTime";

/**
 * 日付文字列を「YYYY年M月D日（曜日）」形式の日本語文字列に変換する
 *
 * @param dateString - ISO 8601形式の日付文字列（例: "2024-06-29T10:30:00.000Z"）、supabase の timestamp UTC も可
 * @returns 日本語形式の日付文字列（例: "2024年6月29日（土）"）
 *
 * @example
 * ```typescript
 * formatDateStringYMDW("2024-06-29T10:30:00.000Z")
 * // => "2024年6月29日（土）"
 *
 * formatDateStringYMDW("2024-01-05T00:00:00.000Z")
 * // => "2024年1月5日（金）"
 * ```
 *
 * @throws {Error} 無効な日付形式の場合はnormalizeDateTimeがエラーをスロー
 *
 * @remarks
 * - 入力された日付文字列はnormalizeDateTimeで正規化される
 * - タイムゾーンはAsia/Tokyo（JST）で表示される
 * - 曜日は日本語で表示される（日、月、火、水、木、金、土）
 */
export const formatDateStringYMDW = (dateString: string) => {
  // UTC
  const date = new Date(normalizeDateTime(dateString));

  // Convert to JST for display
  const jstDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const year = jstDate.getFullYear();
  const month = jstDate.getMonth() + 1;
  const day = jstDate.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][
    jstDate.getDay()
  ];

  return `${year}年${month}月${day}日（${dayOfWeek}）`;
};
