import { describe, expect, it } from "vitest";
import { formatDateStringYMDW } from "../formatDateStringYMDW";

describe("formatDateStringYMDW", () => {
  it("should format a complete ISO date string correctly", () => {
    const result = formatDateStringYMDW("2024-06-29T10:30:00.000Z");
    expect(result).toBe("2024年6月29日（土）");
  });

  it("should format an incomplete date string correctly", () => {
    const result = formatDateStringYMDW("2024-06-29T10:30:00");
    expect(result).toBe("2024年6月29日（土）");
  });

  it("should handle different days of the week", () => {
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

  it("should handle single digit months and days", () => {
    const result = formatDateStringYMDW("2024-01-05T00:00:00.000Z");
    expect(result).toBe("2024年1月5日（金）");
  });

  it("should handle year boundaries", () => {
    const result = formatDateStringYMDW("2023-12-31T00:00:00.000Z");
    expect(result).toBe("2023年12月31日（日）");
  });

  it("should handle timezone conversion to JST correctly", () => {
    // UTC midnight should convert to JST 9:00 AM (same day)
    const result = formatDateStringYMDW("2024-06-29T00:00:00.000Z");
    expect(result).toBe("2024年6月29日（土）");

    // UTC 15:00 should convert to JST midnight next day
    const result2 = formatDateStringYMDW("2024-06-28T15:00:00.000Z");
    expect(result2).toBe("2024年6月29日（土）");
  });

  it("should handle leap year correctly", () => {
    const result = formatDateStringYMDW("2024-02-29T00:00:00.000Z");
    expect(result).toBe("2024年2月29日（木）");
  });

  it("should handle different time formats", () => {
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
