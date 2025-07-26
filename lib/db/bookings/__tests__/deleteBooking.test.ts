/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database.types";
import { deleteBooking } from "../deleteBooking";

describe("deleteBooking", () => {
  let mockSupabase: Partial<SupabaseClient<Database>>;
  let mockFrom: ReturnType<typeof vi.fn>;

  const mockUserProfile = { id: 123, role: "user" };
  const mockAdminProfile = { id: 456, role: "admin" };
  const mockParams = { bookingId: 1 };

  const mockBooking = {
    id: 1,
    profile_id: 123,
    deleted_at: null,
  };

  const mockDeletedBooking = {
    id: 1,
    profile_id: 123,
    deleted_at: "2024-01-01T10:00:00Z",
    deleted_by_profile_id: 123,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockFrom = vi.fn();

    // Setup default mock behavior for booking fetch
    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockBooking, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockDeletedBooking, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock the Supabase client
    mockSupabase = {
      from: mockFrom,
    };
  });

  describe("正常なケース", () => {
    it("所有者が自分の予約を削除できる", async () => {
      const result = await deleteBooking(
        mockUserProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual(mockDeletedBooking);
      expect(mockFrom).toHaveBeenCalledWith("bookings");
    });

    it("管理者が他のユーザーの予約を削除できる", async () => {
      const otherUserBooking = {
        id: 1,
        profile_id: 789, // 他のユーザーの予約
        deleted_at: null,
      };

      const deletedByAdmin = {
        id: 1,
        profile_id: 789,
        deleted_at: "2024-01-01T10:00:00Z",
        deleted_by_profile_id: 456, // 管理者のID
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: otherUserBooking, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: deletedByAdmin, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await deleteBooking(
        mockAdminProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual(deletedByAdmin);
    });

    it("削除時にdeleted_atとdeleted_by_profile_idが正しく設定される", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockDeletedBooking, error: null }),
          }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      await deleteBooking(
        mockUserProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          deleted_by_profile_id: mockUserProfile.id,
        }),
      );
    });
  });

  describe("バリデーションエラー", () => {
    it("無効なbookingIdでエラーが発生する", async () => {
      const invalidParams = {
        bookingId: "invalid" as any,
      };

      await expect(
        deleteBooking(
          mockUserProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("ゼロ以下のbookingIdでエラーが発生する", async () => {
      const invalidParams = {
        bookingId: 0,
      };

      await expect(
        deleteBooking(
          mockUserProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("負の値のbookingIdでエラーが発生する", async () => {
      const invalidParams = {
        bookingId: -1,
      };

      await expect(
        deleteBooking(
          mockUserProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });
  });

  describe("権限エラー", () => {
    it("存在しない予約を削除しようとするとエラーが発生する", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("予約が見つかりません");
    });

    it("データベースエラーが発生する", async () => {
      const databaseError = new Error("Database connection failed");

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: databaseError }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(databaseError);
    });

    it("既に削除された予約を削除しようとするとエラーが発生する", async () => {
      const alreadyDeletedBooking = {
        id: 1,
        profile_id: 123,
        deleted_at: "2024-01-01T10:00:00Z",
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: alreadyDeletedBooking,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("この予約は既に削除されています");
    });

    it("一般ユーザーが他人の予約を削除しようとするとエラーが発生する", async () => {
      const otherUserBooking = {
        id: 1,
        profile_id: 789, // 他のユーザーの予約
        deleted_at: null,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: otherUserBooking, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile, // 一般ユーザー
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("この予約を削除する権限がありません");
    });
  });

  describe("管理者権限テスト", () => {
    it("管理者は任意のユーザーの予約を削除できる", async () => {
      const otherUserBooking = {
        id: 1,
        profile_id: 999,
        deleted_at: null,
      };

      const deletedByAdmin = {
        id: 1,
        profile_id: 999,
        deleted_at: "2024-01-01T10:00:00Z",
        deleted_by_profile_id: 456,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: otherUserBooking, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: deletedByAdmin, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await deleteBooking(
        mockAdminProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual(deletedByAdmin);
    });

    it("大文字小文字の違うロールは管理者として認識されない", async () => {
      const notAdminProfile = { id: 456, role: "Admin" }; // 大文字

      const otherUserBooking = {
        id: 1,
        profile_id: 999,
        deleted_at: null,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: otherUserBooking, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          notAdminProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("この予約を削除する権限がありません");
    });
  });

  describe("データベース更新エラー", () => {
    it("更新処理でエラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const updateError = new Error("Database update failed");

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: updateError }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(updateError);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Booking deletion failed:",
        expect.objectContaining({
          name: updateError.name,
          message: updateError.message,
          timestamp: expect.any(String),
        }),
      );
      consoleSpy.mockRestore();
    });

    it("更新後のデータが返されない場合にエラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        deleteBooking(
          mockUserProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("予約の削除に失敗しました");

      expect(consoleSpy).toHaveBeenCalledWith("Booking deletion failed:", null);
      consoleSpy.mockRestore();
    });
  });

  describe("エッジケース", () => {
    it("最大数値のbookingIdで正常に動作する", async () => {
      const largeIdParams = {
        bookingId: Number.MAX_SAFE_INTEGER,
      };

      const largeIdBooking = {
        id: Number.MAX_SAFE_INTEGER,
        profile_id: 123,
        deleted_at: null,
      };

      const deletedLargeIdBooking = {
        id: Number.MAX_SAFE_INTEGER,
        profile_id: 123,
        deleted_at: "2024-01-01T10:00:00Z",
        deleted_by_profile_id: 123,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: largeIdBooking, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: deletedLargeIdBooking,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await deleteBooking(
        mockUserProfile,
        largeIdParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual(deletedLargeIdBooking);
    });

    it("deleted_atのタイムスタンプが正しい形式である", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockDeletedBooking, error: null }),
          }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      await deleteBooking(
        mockUserProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          deleted_by_profile_id: mockUserProfile.id,
        }),
      );
    });
  });
});
