import { expect, test } from "vitest";
import { timeToDecimalHours } from "../timeToDecimalHours";

describe("timeToDecimalHours", () => {
  test.each([
    [new Date("1990-01-01T00:00+09:00"), 0],
    [new Date("1990-01-01T12:30+09:00"), 12.5],
    [new Date("1990-01-01T23:45+09:00"), 23.75],
  ])("timeToDecimalHours(%j) -> %i", (time, expected) => {
    expect(timeToDecimalHours(time)).toBe(expected);
  });
});
