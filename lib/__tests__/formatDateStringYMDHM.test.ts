import { describe, expect, it } from "vitest";
import { formatDateStringYMDHM } from "../formatDateStringYMDHM";

describe("formatDateStringYMDHM", () => {
  it("formats a basic date string correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T14:30:00");
    expect(result).toBe("2024/01/15 23:30");
  });

  it("formats midnight correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T00:00:00");
    expect(result).toBe("2024/01/15 09:00");
  });

  it("formats noon correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T12:00:00");
    expect(result).toBe("2024/01/15 21:00");
  });

  it("formats end of day correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T23:59:59");
    expect(result).toBe("2024/01/16 08:59");
  });

  it("handles single digit months and days (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-01T09:05:00");
    expect(result).toBe("2024/01/01 18:05");
  });

  it("handles double digit months and days (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-12-31T23:59:59");
    expect(result).toBe("2025/01/01 08:59");
  });

  it("handles leap year correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-02-29T12:00:00");
    expect(result).toBe("2024/02/29 21:00");
  });

  it("handles non-leap year February correctly (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2023-02-28T12:00:00");
    expect(result).toBe("2023/02/28 21:00");
  });

  it("handles ISO 8601 format with timezone", () => {
    const result = formatDateStringYMDHM("2024-01-15T14:30:00+09:00");
    expect(result).toBe("2024/01/15 14:30");
  });

  it("handles ISO 8601 format with UTC timezone", () => {
    const result = formatDateStringYMDHM("2024-01-15T05:30:00Z");
    expect(result).toBe("2024/01/15 14:30");
  });

  it("handles different timezone and converts to Asia/Tokyo", () => {
    const result = formatDateStringYMDHM("2024-01-15T00:30:00-05:00");
    expect(result).toBe("2024/01/15 14:30");
  });

  it("handles milliseconds in the input (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T14:30:00.123");
    expect(result).toBe("2024/01/15 23:30");
  });

  it("handles different years (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2025-06-15T14:30:00");
    expect(result).toBe("2025/06/15 23:30");
  });

  it("handles early morning hours (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T01:05:00");
    expect(result).toBe("2024/01/15 10:05");
  });

  it("handles late evening hours (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T22:45:00");
    expect(result).toBe("2024/01/16 07:45");
  });

  it("handles all months correctly (UTC -> Asia/Tokyo)", () => {
    const months = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    months.forEach((month, _index) => {
      const result = formatDateStringYMDHM(`2024-${month}-15T14:30:00`);
      expect(result).toBe(`2024/${month}/15 23:30`);
    });
  });

  it("handles dates with seconds but ignores them in output (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T14:30:45");
    expect(result).toBe("2024/01/15 23:30");
  });

  it("handles dates with zero seconds (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-15T14:30:00");
    expect(result).toBe("2024/01/15 23:30");
  });

  it("handles timezone conversion correctly for DST period", () => {
    const result = formatDateStringYMDHM("2024-07-15T05:30:00Z");
    expect(result).toBe("2024/07/15 14:30");
  });

  it("handles timezone conversion correctly for non-DST period", () => {
    const result = formatDateStringYMDHM("2024-01-15T05:30:00Z");
    expect(result).toBe("2024/01/15 14:30");
  });

  it("handles string that needs normalization - should throw error", () => {
    expect(() => formatDateStringYMDHM("2024-01-15 14:30:00")).toThrow(
      "Invalid datetime format",
    );
  });

  it("handles edge case: first day of year (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-01-01T00:00:00");
    expect(result).toBe("2024/01/01 09:00");
  });

  it("handles edge case: last day of year (UTC -> Asia/Tokyo)", () => {
    const result = formatDateStringYMDHM("2024-12-31T23:59:59");
    expect(result).toBe("2025/01/01 08:59");
  });
});
