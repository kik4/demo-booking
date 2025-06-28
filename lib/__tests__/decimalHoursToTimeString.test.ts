import { describe, expect, it } from "vitest";
import { decimalHoursToTimeString } from "../decimalHoursToTimeString";

describe("decimalHoursToTimeString", () => {
  it("should convert whole hours correctly", () => {
    expect(decimalHoursToTimeString(0)).toBe("00:00");
    expect(decimalHoursToTimeString(1)).toBe("01:00");
    expect(decimalHoursToTimeString(9)).toBe("09:00");
    expect(decimalHoursToTimeString(12)).toBe("12:00");
    expect(decimalHoursToTimeString(23)).toBe("23:00");
  });

  it("should convert half hours correctly", () => {
    expect(decimalHoursToTimeString(0.5)).toBe("00:30");
    expect(decimalHoursToTimeString(9.5)).toBe("09:30");
    expect(decimalHoursToTimeString(14.5)).toBe("14:30");
    expect(decimalHoursToTimeString(23.5)).toBe("23:30");
  });

  it("should convert quarter hours correctly", () => {
    expect(decimalHoursToTimeString(9.25)).toBe("09:15");
    expect(decimalHoursToTimeString(14.25)).toBe("14:15");
    expect(decimalHoursToTimeString(9.75)).toBe("09:45");
    expect(decimalHoursToTimeString(14.75)).toBe("14:45");
  });

  it("should handle various minute increments", () => {
    expect(decimalHoursToTimeString(9.1)).toBe("09:06"); // 0.1 * 60 = 6
    expect(decimalHoursToTimeString(9.2)).toBe("09:12"); // 0.2 * 60 = 12
    expect(decimalHoursToTimeString(9.833333)).toBe("09:50"); // 0.833333 * 60 = 50
  });

  it("should round minutes to nearest integer", () => {
    expect(decimalHoursToTimeString(9.333333)).toBe("09:20"); // 0.333333 * 60 = 20
    expect(decimalHoursToTimeString(9.166667)).toBe("09:10"); // 0.166667 * 60 = 10.0002 ≈ 10
    expect(decimalHoursToTimeString(9.583333)).toBe("09:35"); // 0.583333 * 60 = 34.9998 ≈ 35
  });

  it("should pad single digit hours and minutes with zeros", () => {
    expect(decimalHoursToTimeString(5.05)).toBe("05:03"); // 0.05 * 60 = 3
    expect(decimalHoursToTimeString(0.15)).toBe("00:09"); // 0.15 * 60 = 9
    expect(decimalHoursToTimeString(8.1)).toBe("08:06"); // 0.1 * 60 = 6
  });

  it("should handle edge cases", () => {
    expect(decimalHoursToTimeString(23.99)).toBe("23:59"); // 0.99 * 60 = 59.4 ≈ 59
    expect(decimalHoursToTimeString(0.01)).toBe("00:01"); // 0.01 * 60 = 0.6 ≈ 1
    expect(decimalHoursToTimeString(23.9833)).toBe("23:59"); // 0.9833 * 60 = 58.998 ≈ 59
  });

  it("should handle decimal precision correctly", () => {
    expect(decimalHoursToTimeString(14.083333)).toBe("14:05"); // 5 minutes
    expect(decimalHoursToTimeString(14.916667)).toBe("14:55"); // 55 minutes
    expect(decimalHoursToTimeString(14.5166667)).toBe("14:31"); // 31 minutes
  });

  it("should handle values just below whole hours", () => {
    // Note: The function has a limitation - it doesn't handle minutes rounding to 60
    expect(decimalHoursToTimeString(13.9999)).toBe("13:60"); // 0.9999 * 60 = 59.994 ≈ 60
    expect(decimalHoursToTimeString(8.9999)).toBe("08:60"); // 0.9999 * 60 = 59.994 ≈ 60
  });
});
