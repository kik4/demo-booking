import { describe, expect, it } from "vitest";
import { formatTime } from "../formatTime";

describe("formatTime", () => {
  it("完全なISO日付文字列をJST時刻に正しく変換する", () => {
    const result = formatTime("2024-06-29T10:30:00.000Z");
    expect(result).toBe("19:30");
  });

  it("UTC午前0時をJST午前9時に変換する", () => {
    const result = formatTime("2024-06-29T00:00:00.000Z");
    expect(result).toBe("09:00");
  });

  it("UTC正午をJST午後9時に変換する", () => {
    const result = formatTime("2024-06-29T12:00:00.000Z");
    expect(result).toBe("21:00");
  });

  it("UTC 15:00をJST午前0時に変換する", () => {
    const result = formatTime("2024-06-29T15:00:00.000Z");
    expect(result).toBe("00:00");
  });

  it("不完全な日付文字列を正しく処理する", () => {
    // 注：不完全な日付文字列はUTCとして扱われ、JSTに変換される
    const result = formatTime("2024-06-29T10:30:00");
    expect(result).toBe("19:30");
  });

  it("秒付きの時刻を正しくフォーマットする", () => {
    expect(formatTime("2024-06-29T10:30:45.000Z")).toBe("19:30");
    expect(formatTime("2024-06-29T10:30:45.123Z")).toBe("19:30");
  });

  it("異なるUTCオフセットを正しく処理する", () => {
    // 様々なUTC時刻をJST時刻に変換
    expect(formatTime("2024-06-29T01:00:00.000Z")).toBe("10:00");
    expect(formatTime("2024-06-29T14:30:00.000Z")).toBe("23:30");
    expect(formatTime("2024-06-29T16:15:00.000Z")).toBe("01:15");
  });

  it("24時間フォーマットを維持する", () => {
    expect(formatTime("2024-06-29T03:45:00.000Z")).toBe("12:45");
    expect(formatTime("2024-06-29T06:00:00.000Z")).toBe("15:00");
    expect(formatTime("2024-06-29T13:00:00.000Z")).toBe("22:00");
  });

  it("時間境界のエッジケースを処理する", () => {
    // UTC 23:59は翌日のJST 08:59に変換される
    expect(formatTime("2024-06-29T23:59:00.000Z")).toBe("08:59");

    // UTC 00:01は同日のJST 09:01に変換される
    expect(formatTime("2024-06-29T00:01:00.000Z")).toBe("09:01");
  });

  it("異なる時刻フォーマットを一貫して処理する", () => {
    const baseTime = "10:30";
    expect(formatTime("2024-06-29T01:30:00")).toBe(baseTime);
    expect(formatTime("2024-06-29T01:30:00.000")).toBe(baseTime);
    expect(formatTime("2024-06-29T01:30:00.000Z")).toBe(baseTime);
  });
});
