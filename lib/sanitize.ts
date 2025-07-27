/**
 * ログインジェクション対策
 * 改行文字、制御文字を削除してログの整合性を保つ
 */
export function sanitizeForLog(input: string): string {
  return (
    input
      .replace(/[\r\n\t]/g, " ") // 改行・タブを空白に変換
      // biome-ignore lint/suspicious/noControlCharactersInRegex: 必要のため
      .replace(/[\u0000-\u001f]/g, "") // 制御文字除去
      .replace(/[\u007f-\u009f]/g, "") // 拡張制御文字除去
      .substring(0, 200) // 長さ制限（ログの肥大化防止）
      .trim()
  );
}

/**
 * 危険なパターンの検出
 * サニタイゼーション前に攻撃パターンを検出してログに記録
 */
export function detectSuspiciousInput(input: string): {
  isSuspicious: boolean;
  patterns: string[];
} {
  const suspiciousPatterns = [
    { name: "script_tag", regex: /<script\b/i },
    { name: "javascript_url", regex: /javascript:/i },
    { name: "event_handler", regex: /on\w+\s*=/i },
    { name: "data_url", regex: /data:/i },
    { name: "style_expression", regex: /expression\s*\(/i },
    { name: "vbscript", regex: /vbscript:/i },
    { name: "log_injection", regex: /[\r\n].*\[(?:ERROR|WARN|INFO|DEBUG)\]/i },
  ];

  const detectedPatterns: string[] = [];

  for (const pattern of suspiciousPatterns) {
    if (pattern.regex.test(input)) {
      detectedPatterns.push(pattern.name);
    }
  }

  return {
    isSuspicious: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  };
}

/**
 * 安全なログ出力ユーティリティ
 * ログインジェクション対策を自動適用し、44箇所のconsole使用を統一
 */
export const safeLog = {
  /**
   * エラーログ（自動サニタイゼーション付き）
   */
  error: (message: string, data?: unknown) => {
    const safeData = sanitizeLogData(data);
    console.error(message, safeData);
  },

  /**
   * 警告ログ（自動サニタイゼーション付き）
   */
  warn: (message: string, data?: unknown) => {
    const safeData = sanitizeLogData(data);
    console.warn(message, safeData);
  },

  /**
   * 情報ログ（低リスクなのでサニタイゼーションなし）
   */
  info: console.info,
} as const;

/**
 * ログデータのサニタイゼーション
 * エラーオブジェクトや文字列を安全に処理
 */
function sanitizeLogData(data: unknown): unknown {
  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeForLog(data.message),
      stack: data.stack, // スタックトレースは保持（デバッグ用）
      timestamp: new Date().toISOString(),
    };
  }

  if (typeof data === "string") {
    return sanitizeForLog(data);
  }

  if (data && typeof data === "object") {
    // オブジェクトの場合、文字列フィールドをサニタイゼーション
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] =
        typeof value === "string" ? sanitizeForLog(value) : value;
    }
    return sanitized;
  }

  return data;
}
