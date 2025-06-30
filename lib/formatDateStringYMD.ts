/**
 * 日付文字列を日本語形式（YYYY/MM/DD）にフォーマットします
 *
 * この関数は日付文字列の日付部分（YYYY-MM-DD）のみを使用し、
 * タイムゾーンの影響を受けないように設計されています。
 * 時刻情報は無視され、常に指定された日付がそのまま表示されます。
 *
 * @param dateString - フォーマットする日付文字列
 *   - ISO 8601形式（例: "2024-12-31"、"2024-12-31T10:30:00"）
 * @returns 日本語ロケールでフォーマットされた日付文字列
 *   - 形式: "YYYY/MM/DD" または "YYYY/M/D"（先頭ゼロは除去）
 *   - 例: "2024/12/31"、"2024/1/1"
 *
 * @example
 * ```typescript
 * // 基本的な使用例
 * formatDateStringYMD("2024-12-31") // "2024/12/31"
 * formatDateStringYMD("2024-01-01") // "2024/1/1"
 *
 * // 時刻情報は無視される
 * formatDateStringYMD("2024-12-31T23:59:59") // "2024/12/31"
 * formatDateStringYMD("2024-12-31T23:59:59Z") // "2024/12/31"
 *
 * // タイムゾーンに関係なく日付部分のみが使用される
 * formatDateStringYMD("2024-06-29T19:30:00+09:00") // "2024/6/29"
 * formatDateStringYMD("2024-06-29T19:30:00Z") // "2024/6/29"
 * ```
 *
 * @note
 * - 入力文字列の最初の10文字（YYYY-MM-DD部分）のみを使用
 * - タイムゾーンオフセットを調整して、ローカル日付として解釈
 * - 時刻やタイムゾーン情報による日付の変更を防ぐ
 */
export const formatDateStringYMD = (dateString: string) => {
  const date = new Date(dateString.slice(0, 10));
  return new Date(
    date.getTime() + date.getTimezoneOffset() * 60 * 1000,
  ).toLocaleDateString("ja-JP");
};
