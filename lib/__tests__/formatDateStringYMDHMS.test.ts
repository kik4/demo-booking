import { describe, expect, it } from "vitest";
import { formatDateStringYMDHMS } from "../formatDateStringYMDHMS";

describe("formatDateStringYMDHMS", () => {
  it("完全なISO日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMDHMS("2024-06-29T10:30:45.000Z");
    expect(result).toBe("2024/06/29 19:30:45");
  });

  it("不完全な日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMDHMS("2024-06-29T10:30:45");
    expect(result).toBe("2024/06/29 19:30:45");
  });

  it("タイムゾーン付きの日付文字列を正しくフォーマットする", () => {
    const result = formatDateStringYMDHMS("2024-06-29T10:30:45+09:00");
    expect(result).toBe("2024/06/29 10:30:45");
  });

  it("午前0時を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T00:00:00");
    expect(result).toBe("2024/06/29 09:00:00");
  });

  it("午後11時59分59秒を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T23:59:59");
    expect(result).toBe("2024/06/30 08:59:59");
  });

  it("一桁の月と日を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-01-05T09:15:30");
    expect(result).toBe("2024/01/05 18:15:30");
  });

  it("二桁の月と日を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-12-25T14:45:20");
    expect(result).toBe("2024/12/25 23:45:20");
  });

  it("年の境界を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2023-12-31T23:59:59");
    expect(result).toBe("2024/01/01 08:59:59");
  });

  it("年始を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-01-01T00:00:00");
    expect(result).toBe("2024/01/01 09:00:00");
  });

  it("UTC時刻をJST時刻に変換する", () => {
    // UTC午前0時はJST午前9時に変換される
    const result = formatDateStringYMDHMS("2024-06-29T00:00:00.000Z");
    expect(result).toBe("2024/06/29 09:00:00");

    // UTC 15:00はJST翌日午前0時に変換される
    const result2 = formatDateStringYMDHMS("2024-06-28T15:00:00.000Z");
    expect(result2).toBe("2024/06/29 00:00:00");
  });

  it("うるう年を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-02-29T12:30:45");
    expect(result).toBe("2024/02/29 21:30:45");
  });

  it("うるう年でない年の2月末を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2023-02-28T23:59:59");
    expect(result).toBe("2023/03/01 08:59:59");
  });

  it("異なる時刻フォーマットを正しく処理する", () => {
    expect(formatDateStringYMDHMS("2024-06-29T10:30:45")).toBe(
      "2024/06/29 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-06-29T10:30:45.123")).toBe(
      "2024/06/29 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-06-29T10:30:45.123Z")).toBe(
      "2024/06/29 19:30:45",
    );
  });

  it("各月の末日を正しく処理する", () => {
    expect(formatDateStringYMDHMS("2024-01-31T10:30:45")).toBe(
      "2024/01/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-02-29T10:30:45")).toBe(
      "2024/02/29 19:30:45",
    ); // うるう年
    expect(formatDateStringYMDHMS("2024-03-31T10:30:45")).toBe(
      "2024/03/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-04-30T10:30:45")).toBe(
      "2024/04/30 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-05-31T10:30:45")).toBe(
      "2024/05/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-06-30T10:30:45")).toBe(
      "2024/06/30 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-07-31T10:30:45")).toBe(
      "2024/07/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-08-31T10:30:45")).toBe(
      "2024/08/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-09-30T10:30:45")).toBe(
      "2024/09/30 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-10-31T10:30:45")).toBe(
      "2024/10/31 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-11-30T10:30:45")).toBe(
      "2024/11/30 19:30:45",
    );
    expect(formatDateStringYMDHMS("2024-12-31T10:30:45")).toBe(
      "2024/12/31 19:30:45",
    );
  });

  it("古い日付を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2000-01-01T12:00:00");
    expect(result).toBe("2000/01/01 21:00:00");
  });

  it("未来の日付を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2030-12-31T23:59:59");
    expect(result).toBe("2031/01/01 08:59:59");
  });

  it("一桁の時分秒を正しく0埋めする", () => {
    const result = formatDateStringYMDHMS("2024-06-29T01:02:03");
    expect(result).toBe("2024/06/29 10:02:03");
  });

  it("二桁の時分秒を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T12:34:56");
    expect(result).toBe("2024/06/29 21:34:56");
  });

  it("秒が0の場合を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T12:34:00");
    expect(result).toBe("2024/06/29 21:34:00");
  });

  it("分が0の場合を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T12:00:34");
    expect(result).toBe("2024/06/29 21:00:34");
  });

  it("時が0の場合を正しく処理する", () => {
    const result = formatDateStringYMDHMS("2024-06-29T00:34:56");
    expect(result).toBe("2024/06/29 09:34:56");
  });
});
