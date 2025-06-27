import { splitRange } from "../splitRange";

describe("splitRange", () => {
  it("全く重なっている場合", () => {
    const range = { start: 1, end: 2 };
    expect(splitRange(range, range)).toEqual([]);
  });

  it("後ろにある場合", () => {
    const range1 = { start: 1, end: 2 };
    const range2 = { start: 30, end: 40 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("前にある場合", () => {
    const range1 = { start: 1, end: 2 };
    const range2 = { start: 0, end: 1 };
    expect(splitRange(range1, range2)).toEqual([range1]);
  });

  it("後ろに重なっている場合", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 3, end: 12 };
    expect(splitRange(range1, range2)).toEqual([{ start: 1, end: 3 }]);
  });

  it("前に重なっている場合", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 5 };
    expect(splitRange(range1, range2)).toEqual([{ start: 5, end: 10 }]);
  });

  it("中に重なっている場合", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 2, end: 5 };
    expect(splitRange(range1, range2)).toEqual([
      { start: 1, end: 2 },
      { start: 5, end: 10 },
    ]);
  });

  it("外に重なっている場合", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 50 };
    expect(splitRange(range1, range2)).toEqual([]);
  });

  it("外に重なっている場合で前が同じ", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 1, end: 50 };
    expect(splitRange(range1, range2)).toEqual([]);
  });

  it("外に重なっている場合で後が同じ", () => {
    const range1 = { start: 1, end: 10 };
    const range2 = { start: 0, end: 10 };
    expect(splitRange(range1, range2)).toEqual([]);
  });
});
