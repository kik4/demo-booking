import { describe, expect, it } from "vitest";
import { formatDateStringYMDW } from "../formatDateStringYMDW";

describe("formatDateStringYMDW", () => {
  it("完全なISO日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMDW("2024-06-29T10:30:00.000Z");
    expect(result).toBe("2024年6月29日（土）");
  });

  it("不完全な日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMDW("2024-06-29T10:30:00");
    expect(result).toBe("2024年6月29日（土）");
  });

  it("不完全な日付文字列を正しくフォーマットする（UTC->JST）", () => {
    const result = formatDateStringYMDW("2024-06-29T19:30:00");
    expect(result).toBe("2024年6月30日（日）");
  });

  it("異なる曜日を正しく処理する", () => {
    expect(formatDateStringYMDW("2024-06-30T00:00:00.000Z")).toBe(
      "2024年6月30日（日）",
    );
    expect(formatDateStringYMDW("2024-07-01T00:00:00.000Z")).toBe(
      "2024年7月1日（月）",
    );
    expect(formatDateStringYMDW("2024-07-02T00:00:00.000Z")).toBe(
      "2024年7月2日（火）",
    );
    expect(formatDateStringYMDW("2024-07-03T00:00:00.000Z")).toBe(
      "2024年7月3日（水）",
    );
    expect(formatDateStringYMDW("2024-07-04T00:00:00.000Z")).toBe(
      "2024年7月4日（木）",
    );
    expect(formatDateStringYMDW("2024-07-05T00:00:00.000Z")).toBe(
      "2024年7月5日（金）",
    );
    expect(formatDateStringYMDW("2024-07-06T00:00:00.000Z")).toBe(
      "2024年7月6日（土）",
    );
  });

  it("一桁の月と日を正しく処理する", () => {
    const result = formatDateStringYMDW("2024-01-05T00:00:00.000Z");
    expect(result).toBe("2024年1月5日（金）");
  });

  it("年の境界を正しく処理する", () => {
    const result = formatDateStringYMDW("2023-12-31T00:00:00.000Z");
    expect(result).toBe("2023年12月31日（日）");
  });

  it("JSTタイムゾーン変換を正しく処理する", () => {
    // UTC午前0時はJST午前9時（同日）に変換される
    const result = formatDateStringYMDW("2024-06-29T00:00:00.000Z");
    expect(result).toBe("2024年6月29日（土）");

    // UTC 15:00はJST翌日午前0時に変換される
    const result2 = formatDateStringYMDW("2024-06-28T15:00:00.000Z");
    expect(result2).toBe("2024年6月29日（土）");
  });

  it("うるう年を正しく処理する", () => {
    const result = formatDateStringYMDW("2024-02-29T00:00:00.000Z");
    expect(result).toBe("2024年2月29日（木）");
  });

  it("異なる時刻フォーマットを正しく処理する", () => {
    expect(formatDateStringYMDW("2024-06-29T10:30:45")).toBe(
      "2024年6月29日（土）",
    );
    expect(formatDateStringYMDW("2024-06-29T10:30:45.123")).toBe(
      "2024年6月29日（土）",
    );
    expect(formatDateStringYMDW("2024-06-29T10:30:45.123Z")).toBe(
      "2024年6月29日（土）",
    );
  });
});
