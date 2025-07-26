import { describe, expect, it, vi } from "vitest";
import { withRateLimit, withUserRateLimit } from "../rateLimit";

describe("Rate Limiting", () => {
  describe("withRateLimit", () => {
    it("should allow requests within rate limit", async () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      const mockAction = vi.fn(() => Promise.resolve({ success: true }));

      const result = await withRateLimit(config, mockAction);

      expect(result).toEqual({ success: true });
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should block requests exceeding rate limit", async () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      const mockAction = vi.fn(() => Promise.resolve({ success: true }));

      // First two requests should pass
      await withRateLimit(config, mockAction);
      await withRateLimit(config, mockAction);

      // Third request should be blocked
      const result = await withRateLimit(config, mockAction);

      expect(result).toHaveProperty("rateLimited", true);
      expect(result).toHaveProperty("error");
      expect(mockAction).toHaveBeenCalledTimes(2);
    });
  });

  describe("withUserRateLimit", () => {
    it("should allow requests within user rate limit", async () => {
      const userId = "user123";
      const config = { maxRequests: 3, windowMs: 60000 };
      const mockAction = vi.fn(() => Promise.resolve({ success: true }));

      const result = await withUserRateLimit(userId, config, mockAction);

      expect(result).toEqual({ success: true });
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should block requests exceeding user rate limit", async () => {
      const userId = "user123";
      const config = { maxRequests: 2, windowMs: 60000 };
      const mockAction = vi.fn(() => Promise.resolve({ success: true }));

      // First two requests should pass
      await withUserRateLimit(userId, config, mockAction);
      await withUserRateLimit(userId, config, mockAction);

      // Third request should be blocked
      const result = await withUserRateLimit(userId, config, mockAction);

      expect(result).toHaveProperty("rateLimited", true);
      expect(result).toHaveProperty("error");
      expect(mockAction).toHaveBeenCalledTimes(2);
    });

    it("should isolate rate limits between different users", async () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      const mockAction = vi.fn(() => Promise.resolve({ success: true }));

      // User1 reaches limit
      await withUserRateLimit("user1", config, mockAction);
      const user1Result = await withUserRateLimit("user1", config, mockAction);

      // User2 should still be able to make requests
      const user2Result = await withUserRateLimit("user2", config, mockAction);

      expect(user1Result).toHaveProperty("rateLimited", true);
      expect(user2Result).toEqual({ success: true });
      expect(mockAction).toHaveBeenCalledTimes(2);
    });
  });
});
