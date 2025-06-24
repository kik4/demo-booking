import { describe, expect, it } from "vitest";
import { normalizeDateTime } from "@/app/_lib/normalizeDateTime";

describe("normalizeDateTime", () => {
  describe("正常なケース", () => {
    it("完全なISO 8601形式の文字列をそのまま返す", () => {
      const input = "2024-01-15T10:30:45.123Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.123Z");
    });

    it("ミリ秒なしの文字列に000ミリ秒を追加する", () => {
      const input = "2024-01-15T10:30:45Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000Z");
    });

    it("タイムゾーンなしの文字列にUTCタイムゾーンを追加する", () => {
      const input = "2024-01-15T10:30:45.123";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.123Z");
    });

    it("ミリ秒とタイムゾーンなしの文字列を正規化する", () => {
      const input = "2024-01-15T10:30:45";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000Z");
    });

    it("1桁のミリ秒を3桁に正規化する", () => {
      const input = "2024-01-15T10:30:45.1Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.100Z");
    });

    it("2桁のミリ秒を3桁に正規化する", () => {
      const input = "2024-01-15T10:30:45.12Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.120Z");
    });

    it("4桁以上のミリ秒を3桁に切り詰める", () => {
      const input = "2024-01-15T10:30:45.123456Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.123Z");
    });

    it("正のタイムゾーンオフセットを保持する", () => {
      const input = "2024-01-15T10:30:45.123+09:00";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.123+09:00");
    });

    it("負のタイムゾーンオフセットを保持する", () => {
      const input = "2024-01-15T10:30:45.123-05:00";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.123-05:00");
    });

    it("ミリ秒なしでタイムゾーンオフセットありの文字列を正規化する", () => {
      const input = "2024-01-15T10:30:45+09:00";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000+09:00");
    });
  });

  describe("異常なケース", () => {
    it("不正な日付形式でエラーを投げる", () => {
      const input = "invalid-date";
      expect(() => normalizeDateTime(input)).toThrow("Invalid datetime format");
    });

    it("不正な時刻形式を処理する（正規表現は通すが不正な値）", () => {
      const input = "2024-01-15T25:30:45Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T25:30:45.000Z");
    });

    it("不正なタイムゾーン形式を処理する（正規表現は通すが不正な値）", () => {
      const input = "2024-01-15T10:30:45+25:00";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000+25:00");
    });

    it("空文字列でエラーを投げる", () => {
      const input = "";
      expect(() => normalizeDateTime(input)).toThrow("Invalid datetime format");
    });

    it("日付部分のみでエラーを投げる", () => {
      const input = "2024-01-15";
      expect(() => normalizeDateTime(input)).toThrow("Invalid datetime format");
    });

    it("時刻部分のみでエラーを投げる", () => {
      const input = "10:30:45";
      expect(() => normalizeDateTime(input)).toThrow("Invalid datetime format");
    });
  });

  describe("エッジケース", () => {
    it("うるう年の日付を正しく処理する", () => {
      const input = "2024-02-29T10:30:45.123Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-02-29T10:30:45.123Z");
    });

    it("年末年始の日付を正しく処理する", () => {
      const input = "2023-12-31T23:59:59.999Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2023-12-31T23:59:59.999Z");
    });

    it("午前0時の時刻を正しく処理する", () => {
      const input = "2024-01-01T00:00:00.000Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-01T00:00:00.000Z");
    });

    it("0ミリ秒を正しく処理する", () => {
      const input = "2024-01-15T10:30:45.0Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000Z");
    });

    it("00ミリ秒を正しく処理する", () => {
      const input = "2024-01-15T10:30:45.00Z";
      const result = normalizeDateTime(input);
      expect(result).toBe("2024-01-15T10:30:45.000Z");
    });
  });
});
