import { describe, expect, test } from "vitest";
import { getIsAvailableTimeSlot } from "../getIsAvailableTimeSlot";

describe("getIsAvailableTimeSlot", () => {
  test("指定した時間スロットが利用可能スロット内に完全に含まれる場合はtrueを返す", () => {
    // 10:00-11:00のスロットが10:00-11:00の利用可能スロット内に含まれる
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots = [{ start_time: "10:00", end_time: "11:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(true);
  });

  test("指定した時間スロットが広い利用可能スロット内に含まれる場合はtrueを返す", () => {
    // 10:00-11:00のスロットが00:00-24:00の利用可能スロット内に含まれる
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots = [{ start_time: "00:00", end_time: "24:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(true);
  });

  test("利用可能スロットが空の場合はfalseを返す", () => {
    // 利用可能スロットがない場合は予約不可
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots: Array<{ start_time: string; end_time: string }> = [];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });

  test("指定した時間スロットが利用可能スロットと部分的に重複する場合はfalseを返す", () => {
    // 10:00-11:00のスロットが10:30-10:45の利用可能スロットと部分的にしか重複しない
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots = [{ start_time: "10:30", end_time: "10:45" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });

  test("指定した時間スロットが利用可能スロットと全く重複しない場合はfalseを返す", () => {
    // 10:00-11:00のスロットが15:30-18:45の利用可能スロットと全く重複しない
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots = [{ start_time: "15:30", end_time: "18:45" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });

  test("複数の利用可能スロットがあり、いずれかに完全に含まれる場合はtrueを返す", () => {
    // 10:00-11:00のスロットが複数の利用可能スロットのうち9:00-12:00に含まれる
    const timeSlot = { start_time: "10:00", end_time: "11:00" };
    const availableSlots = [
      { start_time: "06:00", end_time: "08:00" },
      { start_time: "09:00", end_time: "12:00" },
      { start_time: "14:00", end_time: "17:00" },
    ];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(true);
  });

  test("複数の利用可能スロットがあるが、どれにも完全に含まれない場合はfalseを返す", () => {
    // 10:00-13:00のスロットが複数の利用可能スロットのどれにも完全に含まれない
    const timeSlot = { start_time: "10:00", end_time: "13:00" };
    const availableSlots = [
      { start_time: "06:00", end_time: "08:00" },
      { start_time: "09:00", end_time: "12:00" },
      { start_time: "14:00", end_time: "17:00" },
    ];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });

  test("時間スロットの開始時刻が利用可能スロットの開始時刻と同じ場合はtrueを返す", () => {
    // 境界値のテスト：開始時刻が同じ
    const timeSlot = { start_time: "09:00", end_time: "10:00" };
    const availableSlots = [{ start_time: "09:00", end_time: "12:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(true);
  });

  test("時間スロットの終了時刻が利用可能スロットの終了時刻と同じ場合はtrueを返す", () => {
    // 境界値のテスト：終了時刻が同じ
    const timeSlot = { start_time: "10:00", end_time: "12:00" };
    const availableSlots = [{ start_time: "09:00", end_time: "12:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(true);
  });

  test("時間スロットが利用可能スロットより早く開始する場合はfalseを返す", () => {
    // 8:00-10:00のスロットが9:00-12:00の利用可能スロットより早く開始
    const timeSlot = { start_time: "08:00", end_time: "10:00" };
    const availableSlots = [{ start_time: "09:00", end_time: "12:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });

  test("時間スロットが利用可能スロットより遅く終了する場合はfalseを返す", () => {
    // 10:00-13:00のスロットが9:00-12:00の利用可能スロットより遅く終了
    const timeSlot = { start_time: "10:00", end_time: "13:00" };
    const availableSlots = [{ start_time: "09:00", end_time: "12:00" }];

    expect(getIsAvailableTimeSlot(timeSlot, availableSlots)).toBe(false);
  });
});
