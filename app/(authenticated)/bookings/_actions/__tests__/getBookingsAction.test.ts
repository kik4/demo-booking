/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireUserAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/supabaseClientServer";
import { getBookingsAction } from "../getBookingsAction";

vi.mock("@/lib/auth");
vi.mock("@/lib/supabase/supabaseClientServer");

describe("getBookingsAction", () => {
  const mockCreateClient = vi.mocked(createClient);
  const mockRequireUserAuth = vi.mocked(requireUserAuth);

  const mockProfile = { id: 123 };
  const mockToday = new Date("2024-01-15T00:00:00.000Z");

  beforeEach(() => {
    vi.setSystemTime(mockToday);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockSupabaseClient = (data: any = null, error: any = null) => {
    const mockQuery = {
      order: vi.fn().mockResolvedValue({
        data,
        error,
      }),
    };

    const mockGte = {
      order: mockQuery.order,
    };

    const mockIs = {
      gte: vi.fn().mockReturnValue(mockGte),
    };

    const mockEq = {
      is: vi.fn().mockReturnValue(mockIs),
    };

    const mockSelect = {
      eq: vi.fn().mockReturnValue(mockEq),
    };

    const mockFrom = {
      select: vi.fn().mockReturnValue(mockSelect),
    };

    return {
      from: vi.fn().mockReturnValue(mockFrom),
    };
  };

  describe("正常なケース", () => {
    it("予約データを正常に取得できる", async () => {
      const mockBookings = [
        {
          id: 1,
          service_name: "カット",
          start_time: "2024-01-15T10:00:00Z",
          end_time: "2024-01-15T11:00:00Z",
          notes: "テストメモ",
          created_at: "2024-01-14T12:00:00Z",
        },
        {
          id: 2,
          service_name: "カラー",
          start_time: "2024-01-16T14:00:00Z",
          end_time: "2024-01-16T16:00:00Z",
          notes: "",
          created_at: "2024-01-14T13:00:00Z",
        },
      ];

      const mockSupabaseClient = createMockSupabaseClient(mockBookings);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      const result = await getBookingsAction();

      expect(result.success).toBe(true);
      expect(result.bookings).toEqual(mockBookings);
      expect(result.error).toBeUndefined();

      // Verify Supabase query was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("bookings");
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith(
        "id, service_name, start_time, end_time, notes, created_at",
      );
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith(
        "profile_id",
        mockProfile.id,
      );
      expect(mockSupabaseClient.from().select().eq().is).toHaveBeenCalledWith(
        "deleted_at",
        null,
      );
      expect(
        mockSupabaseClient.from().select().eq().is().gte,
      ).toHaveBeenCalledWith("start_time", "2024-01-14T15:00:00.000Z");
      expect(
        mockSupabaseClient.from().select().eq().is().gte().order,
      ).toHaveBeenCalledWith("start_time", { ascending: true });
    });

    it("予約がない場合は空配列を返す", async () => {
      const mockSupabaseClient = createMockSupabaseClient([]);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      const result = await getBookingsAction();

      expect(result.success).toBe(true);
      expect(result.bookings).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("今日の00:00:00以降の予約のみ取得する", async () => {
      const testDate = new Date("2024-01-15T09:30:00.000Z");
      vi.setSystemTime(testDate);

      const mockSupabaseClient = createMockSupabaseClient([]);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      await getBookingsAction();

      expect(
        mockSupabaseClient.from().select().eq().is().gte,
      ).toHaveBeenCalledWith("start_time", "2024-01-14T15:00:00.000Z");
    });
  });

  describe("エラーケース", () => {
    it("認証エラーの場合はエラーを返す", async () => {
      mockCreateClient.mockResolvedValue({} as any);
      mockRequireUserAuth.mockResolvedValue({
        error: "認証に失敗しました",
      } as any);

      const result = await getBookingsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("認証に失敗しました");
      expect(result.bookings).toBeUndefined();
    });

    it("データベースエラーの場合はエラーを返す", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockDatabaseError = {
        message: "Database connection failed",
        code: "CONNECTION_ERROR",
      };

      const mockSupabaseClient = createMockSupabaseClient(
        null,
        mockDatabaseError,
      );
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      const result = await getBookingsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("予約情報の取得に失敗しました");
      expect(result.bookings).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Bookings fetch error:",
        mockDatabaseError,
      );

      consoleSpy.mockRestore();
    });

    it("予期しないエラーの場合はエラーを返す", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCreateClient.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await getBookingsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("予期しないエラーが発生しました");
      expect(result.bookings).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("データ型の検証", () => {
    it("Booking型に必要なフィールドが含まれている", async () => {
      const mockBooking = {
        id: 1,
        service_name: "カット",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        notes: "テストメモ",
        created_at: "2024-01-14T12:00:00Z",
      };

      const mockSupabaseClient = createMockSupabaseClient([mockBooking]);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      const result = await getBookingsAction();

      expect(result.success).toBe(true);
      expect(result.bookings).toBeDefined();
      expect(result.bookings?.[0]).toMatchObject({
        id: expect.any(Number),
        service_name: expect.any(String),
        start_time: expect.any(String),
        end_time: expect.any(String),
        notes: expect.any(String),
        created_at: expect.any(String),
      });
    });

    it("select文で指定したフィールドが正しく要求される", async () => {
      const mockSupabaseClient = createMockSupabaseClient([]);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return await callback({ profile: mockProfile } as any);
      });

      await getBookingsAction();

      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith(
        "id, service_name, start_time, end_time, notes, created_at",
      );
    });
  });
});
