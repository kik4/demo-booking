import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  type MockInstance,
  vi,
} from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabaseClientServer", () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { createClient, createServiceClient } from "@/lib/supabaseClientServer";
import { getAvailableTimeSlotsForDateAction } from "../getAvailableTimeSlotsForDateAction";

const mockedCreateClient = createClient as MockedFunction<typeof createClient>;
const mockedCreateServiceClient = createServiceClient as MockedFunction<
  typeof createServiceClient
>;

describe("getAvailableTimeSlotsForDateAction", () => {
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockIs: ReturnType<typeof vi.fn>;
  let mockGte: ReturnType<typeof vi.fn>;
  let mockLte: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockSelect = vi.fn();
    mockFrom = vi.fn();
    mockIs = vi.fn();
    mockGte = vi.fn();
    mockLte = vi.fn();
    mockOrder = vi.fn();
    mockGetUser = vi.fn();

    // Setup default mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ is: mockIs });
    mockIs.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });
    mockLte.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Mock the Supabase client
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    };

    mockedCreateClient.mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>,
    );
    mockedCreateServiceClient.mockResolvedValue(
      mockSupabase as unknown as Awaited<
        ReturnType<typeof createServiceClient>
      >,
    );

    // Default user authentication success
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
  });

  describe("認証関連のテスト", () => {
    it("ユーザーが認証されていない場合はエラーを返す", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(() =>
        getAvailableTimeSlotsForDateAction("2024-01-15"),
      ).rejects.toThrowError(new Error("認証エラー"));
    });

    it("認証エラーが発生した場合はエラーを返す", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });

      await expect(() =>
        getAvailableTimeSlotsForDateAction("2024-01-15"),
      ).rejects.toThrowError(new Error("認証エラー"));
    });
  });

  describe("営業日の判定テスト", () => {
    it("日曜日は空きスロットが0個", async () => {
      // 2024-01-14 is Sunday
      const result = await getAvailableTimeSlotsForDateAction("2024-01-14");

      expect(result).toEqual({
        availableSlots: [],
      });
    });

    it("水曜日は空きスロットが0個", async () => {
      // 2024-01-17 is Wednesday
      const result = await getAvailableTimeSlotsForDateAction("2024-01-17");

      expect(result).toEqual({
        availableSlots: [],
      });
    });

    it("祝日は空きスロットが0個", async () => {
      const result = await getAvailableTimeSlotsForDateAction("2024-07-21"); // 海の日

      expect(result).toEqual({
        availableSlots: [],
      });
    });
  });

  describe("営業時間内のスロット生成テスト", () => {
    it("平日（月曜日）は午前と午後の両方のスロットを生成", async () => {
      // 2024-01-15 is Monday
      const result = await getAvailableTimeSlotsForDateAction("2024-01-15");
      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("土曜日は午前のスロットのみ生成（午後は休業）", async () => {
      // 2024-01-13 is Saturday
      const result = await getAvailableTimeSlotsForDateAction("2024-01-13");
      expect(result).toEqual({
        availableSlots: [{ start_time: "09:00", end_time: "13:00" }],
      });
    });
  });

  describe("既存予約との競合検出テスト", () => {
    it("既存予約がある場合、空き時間が分割される", async () => {
      // Mock existing booking from 10:00 to 11:00
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T01:00:00",
            end_time: "2024-01-15T02:00:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDateAction("2024-01-15");
      expect(result).toEqual({
        availableSlots: [
          {
            start_time: "09:00",
            end_time: "10:00",
          },
          {
            start_time: "11:00",
            end_time: "13:00",
          },
          {
            start_time: "15:00",
            end_time: "19:00",
          },
        ],
      });
    });

    it("複数の既存予約がある場合、さらに空き時間が分割される", async () => {
      // Mock a single existing booking that should clearly conflict
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T01:00:00",
            end_time: "2024-01-15T02:00:00",
          },
          {
            start_time: "2024-01-15T06:00:00",
            end_time: "2024-01-15T11:00:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDateAction("2024-01-15");
      expect(result).toEqual({
        availableSlots: [
          {
            start_time: "09:00",
            end_time: "10:00",
          },
          {
            start_time: "11:00",
            end_time: "13:00",
          },
        ],
      });
    });

    it("既存予約がない場合、営業時間全体が利用可能", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDateAction("2024-01-15");
      expect(result).toStrictEqual({
        availableSlots: [
          {
            end_time: "13:00",
            start_time: "09:00",
          },
          {
            end_time: "19:00",
            start_time: "15:00",
          },
        ],
      });
    });
  });

  describe("データベースエラーハンドリング", () => {
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
      // console.errorをスパイ
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
      // スパイをリストア
      consoleErrorSpy.mockRestore();
    });

    it("予約データ取得エラー時はエラーを返す", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

      await expect(() =>
        getAvailableTimeSlotsForDateAction("2024-01-15"),
      ).rejects.toThrowError(new Error("Database error"));
    });
  });

  describe("データベースクエリの検証", () => {
    it("正しいデータベースクエリが実行される", async () => {
      await getAvailableTimeSlotsForDateAction("2024-01-15");

      expect(mockFrom).toHaveBeenCalledWith("bookings");
      expect(mockSelect).toHaveBeenCalledWith("start_time, end_time");
      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
      expect(mockGte).toHaveBeenCalledWith(
        "start_time",
        new Date("2024-01-15T00:00:00.000+09:00").toISOString(),
      );
      expect(mockLte).toHaveBeenCalledWith(
        "start_time",
        new Date("2024-01-15T23:59:59.999+09:00").toISOString(),
      );
      expect(mockOrder).toHaveBeenCalledWith("start_time", { ascending: true });
    });
  });

  describe("エッジケース", () => {
    it("月末の日付でも正常に動作する", async () => {
      const result = await getAvailableTimeSlotsForDateAction("2024-01-31");

      expect(result.availableSlots).toBeDefined();
    });

    it("うるう年の日付でも正常に動作する", async () => {
      const result = await getAvailableTimeSlotsForDateAction("2024-02-29");

      expect(result.availableSlots).toBeDefined();
    });

    it("年またぎの日付でも正常に動作する", async () => {
      const result = await getAvailableTimeSlotsForDateAction("2024-12-31");

      expect(result.availableSlots).toBeDefined();
    });
  });
});
