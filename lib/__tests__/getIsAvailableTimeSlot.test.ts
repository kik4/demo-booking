import { expect, test } from "vitest";
import { getIsAvailableTimeSlot } from "../getIsAvailableTimeSlot";

describe("getIsAvailableTimeSlot", () => {
  test.each([
    [
      { start_time: "10:00", end_time: "11:00" },
      [{ start_time: "10:00", end_time: "11:00" }],
      true,
    ],
    [
      { start_time: "10:00", end_time: "11:00" },
      [{ start_time: "00:00", end_time: "24:00" }],
      true,
    ],
    [{ start_time: "10:00", end_time: "11:00" }, [], false],
    [
      { start_time: "10:00", end_time: "11:00" },
      [{ start_time: "10:30", end_time: "10:45" }],
      false,
    ],
    [
      { start_time: "10:00", end_time: "11:00" },
      [{ start_time: "15:30", end_time: "18:45" }],
      false,
    ],
  ])("getIsAvailableTimeSlot(%j, %j) -> %j", (a, b, expected) => {
    expect(getIsAvailableTimeSlot(a, b)).toBe(expected);
  });
});
