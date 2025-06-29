import { describe, expect, it } from "vitest";
import { splitRange } from "../splitRange";

describe("splitRange", () => {
  it("範囲が完全に重複している場合は空配列を返す", () => {
    // range1とrange2が完全に同じ範囲の場合、range1は完全に削除される
    const range = { start: 1, end: 2 };
    expect(splitRange(range, range)).toEqual([]);
  });

  it("範囲が重複しない（range2がrange1より後）場合は元の範囲をそのまま返す", () => {
    // range1: [1-2], range2: [30-40] → 重複なしでrange1をそのまま返す
    const range1 = { start: 1, end: 2 };
    const range2 = { start: 30, end: 40 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("範囲が重複しない（range2がrange1より前）場合は元の範囲をそのまま返す", () => {
    // range1: [1-2], range2: [0-1] → 重複なしでrange1をそのまま返す
    const range1 = { start: 1, end: 2 };
    const range2 = { start: 0, end: 1 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("range1の後半部分がrange2と重複する場合は前半部分のみを返す", () => {
    // range1: [1-10], range2: [3-12] → 重複部分[3-10]を除去し[1-3]を返す
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 3, end: 12 };
    expect(splitRange(range1, range2)).toEqual([{ start: 1, end: 3 }]);
  });

  it("range1の前半部分がrange2と重複する場合は後半部分のみを返す", () => {
    // range1: [1-10], range2: [0-5] → 重複部分[1-5]を除去し[5-10]を返す
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 5 };
    expect(splitRange(range1, range2)).toEqual([{ start: 5, end: 10 }]);
  });

  it("range2がrange1の中央部分と重複する場合は前後の部分を返す", () => {
    // range1: [1-10], range2: [2-5] → 重複部分[2-5]を除去し[1-2]と[5-10]を返す
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 2, end: 5 };
    expect(splitRange(range1, range2)).toEqual([
      { start: 1, end: 2 },
      { start: 5, end: 10 },
    ]);
  });

  it("range2がrange1を完全に包含する場合は空配列を返す", () => {
    // range1: [1-10], range2: [0-50] → range1が完全にrange2に含まれるため空配列
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 50 };
    expect(splitRange(range1, range2)).toEqual([]);
  });

  it("range2がrange1を包含し開始点が同じ場合は空配列を返す", () => {
    // range1: [1-10], range2: [1-50] → range1が完全にrange2に含まれるため空配列
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 1, end: 50 };
    expect(splitRange(range1, range2)).toEqual([]);
  });

  it("range2がrange1を包含し終了点が同じ場合は空配列を返す", () => {
    // range1: [1-10], range2: [0-10] → range1が完全にrange2に含まれるため空配列
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 10 };
    expect(splitRange(range1, range2)).toEqual([]);
  });

  it("境界値：range1とrange2が隣接している（後）場合は元の範囲を返す", () => {
    // range1: [1-5], range2: [5-10] → 境界で接触しているが重複なしでrange1をそのまま返す
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 5, end: 10 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("境界値：range1とrange2が隣接している（前）場合は元の範囲を返す", () => {
    // range1: [5-10], range2: [1-5] → 境界で接触しているが重複なしでrange1をそのまま返す
    const range1 = { start: 5, end: 10 };
    const range2 = { start: 1, end: 5 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("range1とrange2の開始点が同じで終了点が異なる場合", () => {
    // range1: [1-5], range2: [1-3] → 開始点が同じなので重複部分[1-3]を除去し後半部分[3-5]のみを返す
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 1, end: 3 };
    expect(splitRange(range1, range2)).toEqual([{ start: 3, end: 5 }]);
  });

  it("range1とrange2の終了点が同じで開始点が異なる場合", () => {
    // range1: [1-5], range2: [3-5] → 重複部分[3-5]を除去し[1-3]を返す
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 3, end: 5 };
    expect(splitRange(range1, range2)).toEqual([{ start: 1, end: 3 }]);
  });
});
