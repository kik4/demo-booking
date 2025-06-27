type NumRange = { start: number; end: number };
export const splitRange = (range1: NumRange, range2: NumRange): NumRange[] => {
  if (range1.start >= range2.start && range1.end <= range2.end) {
    return [];
  }
  if (range1.end <= range2.start || range2.end <= range1.start) {
    return [range1];
  }
  if (range1.start <= range2.start && range2.start <= range1.end) {
    if (range1.end <= range2.end) {
      return [{ start: range1.start, end: range2.start }];
    }
    return [
      { start: range1.start, end: range2.start },
      { start: range2.end, end: range1.end },
    ];
  }
  if (range2.start <= range1.start && range1.start <= range2.end) {
    if (range1.end > range2.end) {
      return [{ start: range2.end, end: range1.end }];
    }
    return [];
  }
  throw new Error("invalid input or imp");
};
