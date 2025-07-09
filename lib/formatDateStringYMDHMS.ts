import { TZDate } from "@date-fns/tz";
import { normalizeDateTime } from "./normalizeDateTime";

/**
 * 日付文字列を日本語形式（YYYY/MM/DD HH:MM:SS）にフォーマットします
 *
 * @param dateString - フォーマットする日付文字列
 *   - ISO 8601形式（例: "2024-12-31T10:30:00"）
 * @returns 日本語ロケールでフォーマットされた日付時刻文字列
 *   - 形式: "YYYY/MM/DD HH:MM:SS"
 *   - 例: "2024/12/31 10:30:00"
 *
 * @example
 * ```typescript
 * formatDateStringYMDHMS("2024-12-31T01:30:00") // "2024/12/31 10:30:00"
 * formatDateStringYMDHMS("2024-01-01T00:15:30") // "2024/01/01 09:15:30"
 * ```
 */
export const formatDateStringYMDHMS = (dateString: string) => {
  const date = new TZDate(normalizeDateTime(dateString), "Asia/Tokyo");
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}/${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
