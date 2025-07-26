import { describe, expect, it, vi } from "vitest";
import { detectSuspiciousInput, safeLog, sanitizeForLog } from "../sanitize";

// 削除: 使われていないサニタイゼーション関数のテスト

describe("sanitizeForLog", () => {
  it("should replace newlines with spaces", () => {
    const input = "Line 1\nLine 2\rLine 3\r\nLine 4";
    const result = sanitizeForLog(input);
    expect(result).toBe("Line 1 Line 2 Line 3  Line 4");
  });

  it("should remove control characters", () => {
    const input = "Hello\x00\x01\x1fWorld";
    const result = sanitizeForLog(input);
    expect(result).toBe("HelloWorld");
  });

  it("should limit length to 200 characters", () => {
    const input = "a".repeat(300);
    const result = sanitizeForLog(input);
    expect(result).toHaveLength(200);
  });

  it("should handle log injection attempts", () => {
    const malicious = `Normal text
[ERROR] 2025-01-26 Fake error message
[INFO] Another fake log entry`;
    const result = sanitizeForLog(malicious);
    expect(result).toBe(
      "Normal text [ERROR] 2025-01-26 Fake error message [INFO] Another fake log entry",
    );
  });
});

// 削除: 使われていない関数のテスト

// FieldSanitizers削除済み（直接sanitizeForLogを使用）

describe("detectSuspiciousInput", () => {
  it("should detect script tags", () => {
    const result = detectSuspiciousInput("<script>alert(1)</script>");
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("script_tag");
  });

  it("should detect javascript URLs", () => {
    const result = detectSuspiciousInput("javascript:alert(1)");
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("javascript_url");
  });

  it("should detect event handlers", () => {
    const result = detectSuspiciousInput('onclick="alert(1)"');
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("event_handler");
  });

  it("should detect data URLs", () => {
    const result = detectSuspiciousInput("data:text/html,<script>");
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("data_url");
  });

  it("should detect log injection attempts", () => {
    const result = detectSuspiciousInput("Normal text\n[ERROR] Fake error");
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("log_injection");
  });

  it("should detect multiple patterns", () => {
    const result = detectSuspiciousInput(
      "javascript:alert(1)<script>test</script>",
    );
    expect(result.isSuspicious).toBe(true);
    expect(result.patterns).toContain("javascript_url");
    expect(result.patterns).toContain("script_tag");
  });

  it("should not flag normal input", () => {
    const result = detectSuspiciousInput("This is a normal booking note");
    expect(result.isSuspicious).toBe(false);
    expect(result.patterns).toHaveLength(0);
  });

  it("should handle empty input", () => {
    const result = detectSuspiciousInput("");
    expect(result.isSuspicious).toBe(false);
    expect(result.patterns).toHaveLength(0);
  });
});

// 削除: XSS攻撃パターンテスト（バリデーションで対応済み）

describe("Log Injection Patterns", () => {
  const logInjectionPatterns = [
    "Normal text\n[ERROR] Fake error message",
    "Input\r[WARN] Warning message",
    "Text\r\n[INFO] Info message",
    "Content\n[DEBUG] Debug message",
    "Input\n[CRITICAL] Critical alert",
  ];

  it.each(logInjectionPatterns)(
    "should neutralize log injection: %s",
    (pattern) => {
      const result = sanitizeForLog(pattern);
      // The result should not contain newlines that could break log format
      expect(result).not.toContain("\n");
      expect(result).not.toContain("\r");
    },
  );
});

describe("safeLog", () => {
  it("should sanitize error data automatically", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const errorData = {
      message: "Error with\nnewline\rand control\x00chars",
      userId: "user123",
    };

    safeLog.error("Test error", errorData);

    expect(consoleSpy).toHaveBeenCalledWith("Test error", {
      message: "Error with newline and controlchars",
      userId: "user123",
    });

    consoleSpy.mockRestore();
  });

  it("should handle Error objects", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Test\nerror\nmessage");

    safeLog.error("Test", error);

    const callArgs = consoleSpy.mock.calls[0][1];
    expect(callArgs).toHaveProperty("name", "Error");
    expect(callArgs).toHaveProperty("message", "Test error message");
    expect(callArgs).toHaveProperty("timestamp");

    consoleSpy.mockRestore();
  });
});
