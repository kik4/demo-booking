import { normalizeDateTime } from "./normalizeDateTime";

/**
 * 日付文字列を日本語形式（YYYY/MM/DD HH:MM）にフォーマットします
 *
 * @param dateString - フォーマットする日付文字列
 *   - ISO 8601形式（例: "2024-12-31T10:30:00"）
 * @returns 日本語ロケールでフォーマットされた日付時刻文字列
 *   - 形式: "YYYY/MM/DD HH:MM"
 *   - 例: "2024/12/31 10:30"
 *
 * @example
 * ```typescript
 * formatDateStringYMDHM("2024-12-31T01:30:00") // "2024/12/31 10:30"
 * formatDateStringYMDHM("2024-01-01T00:15:30") // "2024/01/01 09:15"
 * ```
 */
export const formatDateStringYMDHM = (dateString: string) => {
  const date = new Date(normalizeDateTime(dateString));
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};
