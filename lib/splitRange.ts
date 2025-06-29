type NumRange = { start: number; end: number };

/**
 * range1からrange2と重複する部分を除去し、残った範囲を配列で返す
 *
 * @param range1 - 分割対象の範囲
 * @param range2 - 除去する範囲
 * @returns range1からrange2を除去した結果の範囲配列（0〜2個の範囲）
 *
 * @example
 * ```typescript
 * // 中央部分の除去：前後に分割される
 * splitRange({ start: 1, end: 10 }, { start: 3, end: 7 })
 * // => [{ start: 1, end: 3 }, { start: 7, end: 10 }]
 *
 * // 前半部分の除去：後半のみ残る
 * splitRange({ start: 1, end: 10 }, { start: 0, end: 5 })
 * // => [{ start: 5, end: 10 }]
 *
 * // 完全に包含される：何も残らない
 * splitRange({ start: 3, end: 7 }, { start: 1, end: 10 })
 * // => []
 *
 * // 重複なし：元の範囲をそのまま返す
 * splitRange({ start: 1, end: 5 }, { start: 10, end: 15 })
 * // => [{ start: 1, end: 5 }]
 * ```
 *
 * @remarks
 * - 時間スロットの空き時間計算で、既存予約時間を除去する際に使用
 * - range1が完全にrange2に含まれる場合は空配列を返す
 * - range2がrange1の中央部分と重複する場合は2つの範囲に分割される
 * - 重複がない場合は元のrange1をそのまま返す
 */
export const splitRange = (range1: NumRange, range2: NumRange): NumRange[] => {
  // range1 が range2 に完全に含まれる場合
  if (range1.start >= range2.start && range1.end <= range2.end) {
    return [];
  }

  // range1 が range2 に全く含まれない場合
  if (range1.end <= range2.start || range2.end <= range1.start) {
    return [range1];
  }

  // range2 が range1 に完全に含まれる場合は２つに分割して返す
  if (range1.start < range2.start && range2.end < range1.end) {
    return [
      { start: range1.start, end: range2.start },
      { start: range2.end, end: range1.end },
    ];
  }

  // range1 の終わりが range2 内にある場合
  if (range2.start <= range1.end && range1.end <= range2.end) {
    // range2 の外に range1 がはみ出している場合は前部分を返す
    if (range1.start < range2.start) {
      return [{ start: range1.start, end: range2.start }];
    }
    // range1 がはみ出してない場合は空を返す
    return [];
  }

  // range1 の開始が range2 内にある場合
  if (range2.start <= range1.start && range1.start <= range2.end) {
    // range2 の外に range1 がはみ出している場合は後ろ部分を返す
    if (range1.end > range2.end) {
      return [{ start: range2.end, end: range1.end }];
    }
    // range1 がはみ出してない場合は空を返す
    return [];
  }
  throw new Error("invalid input or imp");
};
