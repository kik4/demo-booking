/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLE_CODES } from "@/constants/roleCode";
import { requireAdminAuth, requireAuth, requireUserAuth } from "../auth";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
};

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("認証されたユーザーの場合、コールバックが実行される", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockCallback = vi.fn().mockResolvedValue({ success: true });

      // Act
      const result = await requireAuth(mockSupabaseClient as any, mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      });
      expect(result).toEqual({ success: true });
    });

    it("未認証ユーザーの場合、エラーが返される", async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockCallback = vi.fn();

      // Act
      const result = await requireAuth(mockSupabaseClient as any, mockCallback);

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "認証が必要です" });
    });

    it("認証エラーの場合、エラーが返される", async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Authentication failed" },
      });

      const mockCallback = vi.fn();

      // Act
      const result = await requireAuth(mockSupabaseClient as any, mockCallback);

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "認証が必要です" });
    });
  });

  describe("requireAdminAuth", () => {
    it("管理者ユーザーの場合、コールバックが実行される", async () => {
      // Arrange
      const mockUser = {
        id: "admin-123",
        email: "admin@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the database query chain
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 1,
          role: ROLE_CODES.ADMIN,
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const mockCallback = vi.fn().mockResolvedValue({ success: true });

      // Act
      const result = await requireAdminAuth(
        mockSupabaseClient as any,
        mockCallback,
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        user: {
          id: "admin-123",
          email: "admin@example.com",
        },
        profile: {
          id: 1,
          role: ROLE_CODES.ADMIN,
        },
      });
      expect(result).toEqual({ success: true });
    });

    it("一般ユーザーの場合、エラーが返される", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 2,
          role: ROLE_CODES.USER,
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const mockCallback = vi.fn();

      // Act
      const result = await requireAdminAuth(
        mockSupabaseClient as any,
        mockCallback,
      );

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "管理者権限が必要です" });
    });

    it("プロフィールが存在しない場合、エラーが返される", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const mockCallback = vi.fn();

      // Act
      const result = await requireAdminAuth(
        mockSupabaseClient as any,
        mockCallback,
      );

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "管理者権限が必要です" });
    });
  });

  describe("requireUserAuth", () => {
    it("一般ユーザーの場合、コールバックが実行される", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 2,
          role: ROLE_CODES.USER,
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const mockCallback = vi.fn().mockResolvedValue({ success: true });

      // Act
      const result = await requireUserAuth(
        mockSupabaseClient as any,
        mockCallback,
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        user: {
          id: "user-123",
          email: "user@example.com",
        },
        profile: {
          id: 2,
          role: ROLE_CODES.USER,
        },
      });
      expect(result).toEqual({ success: true });
    });

    it("管理者ユーザーの場合、エラーが返される", async () => {
      // Arrange
      const mockUser = {
        id: "admin-123",
        email: "admin@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 1,
          role: ROLE_CODES.ADMIN,
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              single: mockSingle,
            })),
          })),
        })),
      });

      const mockCallback = vi.fn();

      // Act
      const result = await requireUserAuth(
        mockSupabaseClient as any,
        mockCallback,
      );

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "一般ユーザー権限が必要です" });
    });
  });

  describe("エラーハンドリング", () => {
    it("コールバック関数でエラーが発生した場合、エラーが伝播される", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockError = new Error("Callback error");
      const mockCallback = vi.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        requireAuth(mockSupabaseClient as any, mockCallback),
      ).rejects.toThrow("Callback error");
    });
  });
});
