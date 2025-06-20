import { describe, expect, it } from "vitest";
import { formatUserName, isValidEmail, truncateText } from "../utils";

describe("formatUserName", () => {
  it("正常な名前をそのまま返す", () => {
    expect(formatUserName("田中太郎")).toBe("田中太郎");
  });

  it("前後の空白を削除する", () => {
    expect(formatUserName("  田中太郎  ")).toBe("田中太郎");
  });

  it("空文字列の場合は「ゲスト」を返す", () => {
    expect(formatUserName("")).toBe("ゲスト");
  });

  it("空白のみの場合は「ゲスト」を返す", () => {
    expect(formatUserName("   ")).toBe("ゲスト");
  });
});

describe("isValidEmail", () => {
  it("有効なメールアドレスの場合はtrueを返す", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.jp")).toBe(true);
    expect(isValidEmail("test123@test-domain.org")).toBe(true);
  });

  it("無効なメールアドレスの場合はfalseを返す", () => {
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("test@")).toBe(false);
    expect(isValidEmail("test@.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("truncateText", () => {
  it("指定した長さ以下の場合はそのまま返す", () => {
    expect(truncateText("短いテキスト", 10)).toBe("短いテキスト");
  });

  it("指定した長さを超える場合は切り詰めて「...」を追加する", () => {
    expect(truncateText("これは長いテキストです", 5)).toBe("これは長い...");
  });

  it("指定した長さがちょうどの場合はそのまま返す", () => {
    const text = "ちょうど";
    expect(truncateText(text, text.length)).toBe(text);
  });

  it("空文字列の場合はそのまま返す", () => {
    expect(truncateText("", 5)).toBe("");
  });
});
