import { describe, expect, it } from "vitest";
import { formatDateStringYMD } from "../formatDateStringYMD";

describe("formatDateStringYMD", () => {
  it("完全なISO日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMD("2024-06-29T10:30:00.000Z");
    expect(result).toBe("2024/06/29");
  });

  it("不完全な日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMD("2024-06-29T10:30:00");
    expect(result).toBe("2024/06/29");
  });

  it("不完全な日付文字列を正しくフォーマットする（UTC->JST）", () => {
    const result = formatDateStringYMD("2024-06-29T19:30:00");
    expect(result).toBe("2024/06/29");
  });

  it("日付のみの文字列を正しく処理する", () => {
    const result = formatDateStringYMD("2024-06-29");
    expect(result).toBe("2024/06/29");
  });

  it("一桁の月と日を正しく処理する", () => {
    const result = formatDateStringYMD("2024-01-05T00:00:00.000Z");
    expect(result).toBe("2024/01/05");
  });

  it("二桁の月と日を正しく処理する", () => {
    const result = formatDateStringYMD("2024-12-25T00:00:00.000Z");
    expect(result).toBe("2024/12/25");
  });

  it("年の境界を正しく処理する", () => {
    const result = formatDateStringYMD("2023-12-31T00:00:00.000Z");
    expect(result).toBe("2023/12/31");
  });

  it("年始を正しく処理する", () => {
    const result = formatDateStringYMD("2024-01-01T00:00:00.000Z");
    expect(result).toBe("2024/01/01");
  });

  it("JSTタイムゾーン変換を正しく処理する", () => {
    // UTC午前0時はJST午前9時（同日）に変換される
    const result = formatDateStringYMD("2024-06-29T00:00:00.000Z");
    expect(result).toBe("2024/06/29");

    // UTC 15:00はJST翌日午前0時に変換される
    const result2 = formatDateStringYMD("2024-06-28T15:00:00.000Z");
    expect(result2).toBe("2024/06/28");
  });

  it("うるう年を正しく処理する", () => {
    const result = formatDateStringYMD("2024-02-29T00:00:00.000Z");
    expect(result).toBe("2024/02/29");
  });

  it("うるう年でない年の2月末を正しく処理する", () => {
    const result = formatDateStringYMD("2023-02-28T00:00:00.000Z");
    expect(result).toBe("2023/02/28");
  });

  it("異なる時刻フォーマットを正しく処理する", () => {
    expect(formatDateStringYMD("2024-06-29T10:30:45")).toBe("2024/06/29");
    expect(formatDateStringYMD("2024-06-29T10:30:45.123")).toBe("2024/06/29");
    expect(formatDateStringYMD("2024-06-29T10:30:45.123Z")).toBe("2024/06/29");
  });

  it("各月の末日を正しく処理する", () => {
    expect(formatDateStringYMD("2024-01-31T00:00:00.000Z")).toBe("2024/01/31");
    expect(formatDateStringYMD("2024-02-29T00:00:00.000Z")).toBe("2024/02/29"); // うるう年
    expect(formatDateStringYMD("2024-03-31T00:00:00.000Z")).toBe("2024/03/31");
    expect(formatDateStringYMD("2024-04-30T00:00:00.000Z")).toBe("2024/04/30");
    expect(formatDateStringYMD("2024-05-31T00:00:00.000Z")).toBe("2024/05/31");
    expect(formatDateStringYMD("2024-06-30T00:00:00.000Z")).toBe("2024/06/30");
    expect(formatDateStringYMD("2024-07-31T00:00:00.000Z")).toBe("2024/07/31");
    expect(formatDateStringYMD("2024-08-31T00:00:00.000Z")).toBe("2024/08/31");
    expect(formatDateStringYMD("2024-09-30T00:00:00.000Z")).toBe("2024/09/30");
    expect(formatDateStringYMD("2024-10-31T00:00:00.000Z")).toBe("2024/10/31");
    expect(formatDateStringYMD("2024-11-30T00:00:00.000Z")).toBe("2024/11/30");
    expect(formatDateStringYMD("2024-12-31T00:00:00.000Z")).toBe("2024/12/31");
  });

  it("古い日付を正しく処理する", () => {
    const result = formatDateStringYMD("2000-01-01T00:00:00.000Z");
    expect(result).toBe("2000/01/01");
  });

  it("未来の日付を正しく処理する", () => {
    const result = formatDateStringYMD("2030-12-31T00:00:00.000Z");
    expect(result).toBe("2030/12/31");
  });
});
