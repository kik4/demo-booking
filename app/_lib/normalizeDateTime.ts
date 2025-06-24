/**
 * 不完全な日時文字列をフルサイズのISO 8601形式に修正する関数
 * @param dateTimeString - 修正対象の日時文字列
 * @returns フルサイズのISO 8601形式の日時文字列
 */
export function normalizeDateTime(dateTimeString: string): string {
  // 入力文字列を解析
  const match = dateTimeString.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}:\d{2}))?$/,
  );

  if (!match) {
    throw new Error("Invalid datetime format");
  }

  const [, datePart, timePart, milliseconds, timezone] = match;

  // ミリ秒部分を3桁に正規化
  let normalizedMilliseconds = "000";
  if (milliseconds) {
    if (milliseconds.length >= 3) {
      normalizedMilliseconds = milliseconds.substring(0, 3);
    } else {
      normalizedMilliseconds = milliseconds.padEnd(3, "0");
    }
  }

  // タイムゾーンが指定されていない場合はUTCとして扱う
  const normalizedTimezone = timezone || "Z";

  return `${datePart}T${timePart}.${normalizedMilliseconds}${normalizedTimezone}`;
}
