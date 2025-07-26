import type { SupabaseClient } from "@supabase/supabase-js";
import japaneseHolidays from "japanese-holidays";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  type MockInstance,
  vi,
} from "vitest";
import type { Database } from "@/types/database.types";
import { getAvailableTimeSlotsForDate } from "../getAvailableTimeSlotsForDate";

// Mock japanese-holidays
vi.mock("japanese-holidays", () => ({
  default: {
    isHoliday: vi.fn(),
  },
}));

const mockedIsHoliday = japaneseHolidays.isHoliday as MockedFunction<
  typeof japaneseHolidays.isHoliday
>;

describe("getAvailableTimeSlotsForDate", () => {
  let mockSupabase: Partial<SupabaseClient<Database>>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockIs: ReturnType<typeof vi.fn>;
  let mockGte: ReturnType<typeof vi.fn>;
  let mockLte: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset holiday mock
    mockedIsHoliday.mockReturnValue(undefined);

    // Create fresh mocks for each test
    mockSelect = vi.fn();
    mockFrom = vi.fn();
    mockIs = vi.fn();
    mockGte = vi.fn();
    mockLte = vi.fn();
    mockOrder = vi.fn();

    // Setup default mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ is: mockIs });
    mockIs.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });
    mockLte.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Mock the Supabase client
    mockSupabase = {
      from: mockFrom,
    };
  });

  describe("営業日の判定テスト", () => {
    it("日曜日は空きスロットが0個", async () => {
      // 2024-01-14 is Sunday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-14",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [],
        message: "日曜日は休業日です",
      });
      // Database query should not be called for closed days
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("水曜日は空きスロットが0個", async () => {
      // 2024-01-17 is Wednesday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-17",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [],
        message: "水曜日は休業日です",
      });
      // Database query should not be called for closed days
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("祝日は空きスロットが0個", async () => {
      mockedIsHoliday.mockReturnValue("休みの日");

      const result = await getAvailableTimeSlotsForDate(
        "2025-07-21", // 海の日
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [],
        message: "祝日は休業日です",
      });
      expect(mockedIsHoliday).toHaveBeenCalledWith(
        new Date("2025-07-21T09:00:00+09:00"),
      );
      // Database query should not be called for holidays
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("年末年始期間（12月29日〜1月3日）は空きスロットが0個", async () => {
      const yearEndDates = [
        "2024-12-29",
        "2024-12-30",
        "2024-12-31",
        "2025-01-01",
        "2025-01-02",
        "2025-01-03",
      ];

      for (const date of yearEndDates) {
        const result = await getAvailableTimeSlotsForDate(
          date,
          mockSupabase as SupabaseClient<Database>,
        );

        expect(result).toEqual({
          availableSlots: [],
          message: "年末年始期間（12月29日〜1月3日）は休業日です",
        });
        // Database query should not be called for year-end period
        expect(mockFrom).not.toHaveBeenCalled();
      }
    });

    it("年末年始期間外の日付は通常通り利用可能", async () => {
      const regularDates = [
        "2024-12-28", // December 28th (before year-end period)
        "2025-01-04", // January 4th (after year-end period)
      ];

      for (const date of regularDates) {
        vi.clearAllMocks();
        // Reset mocks for each test
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ is: mockIs });
        mockIs.mockReturnValue({ gte: mockGte });
        mockGte.mockReturnValue({ lte: mockLte });
        mockLte.mockReturnValue({ order: mockOrder });
        mockOrder.mockResolvedValue({ data: [], error: null });

        const result = await getAvailableTimeSlotsForDate(
          date,
          mockSupabase as SupabaseClient<Database>,
        );

        // Both dates should be Saturday (morning only)
        expect(result).toEqual({
          availableSlots: [{ start_time: "09:00", end_time: "13:00" }],
        });
        // Database query should be called for regular dates
        expect(mockFrom).toHaveBeenCalled();
      }
    });
  });

  describe("営業時間内のスロット生成テスト", () => {
    it("平日（月曜日）は午前と午後の両方のスロットを生成", async () => {
      // 2024-01-15 is Monday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("火曜日は午前と午後の両方のスロットを生成", async () => {
      // 2024-01-16 is Tuesday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-16",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("木曜日は午前と午後の両方のスロットを生成", async () => {
      // 2024-01-18 is Thursday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-18",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("金曜日は午前と午後の両方のスロットを生成", async () => {
      // 2024-01-19 is Friday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-19",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("土曜日は午前のスロットのみ生成（午後は休業）", async () => {
      // 2024-01-13 is Saturday
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-13",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [{ start_time: "09:00", end_time: "13:00" }],
      });
    });
  });

  describe("既存予約との競合検出テスト", () => {
    it("既存予約がない場合、営業時間全体が利用可能", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15", // Monday
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("午前中に既存予約がある場合、午前の空き時間が分割される", async () => {
      // Mock existing booking from 10:00 to 11:00
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T10:00:00+09:00",
            end_time: "2024-01-15T11:00:00+09:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "10:00" },
          { start_time: "11:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });

    it("午後に既存予約がある場合、午後の空き時間が分割される", async () => {
      // Mock existing booking from 16:00 to 17:00
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T16:00:00+09:00",
            end_time: "2024-01-15T17:00:00+09:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "16:00" },
          { start_time: "17:00", end_time: "19:00" },
        ],
      });
    });

    it("複数の既存予約がある場合、さらに空き時間が分割される", async () => {
      // Mock multiple existing bookings
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T10:00:00+09:00",
            end_time: "2024-01-15T11:00:00+09:00",
          },
          {
            start_time: "2024-01-15T16:00:00+09:00",
            end_time: "2024-01-15T17:00:00+09:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "10:00" },
          { start_time: "11:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "16:00" },
          { start_time: "17:00", end_time: "19:00" },
        ],
      });
    });

    it("営業時間全体を占める予約がある場合、空きスロットが0個", async () => {
      // Mock booking that covers entire business hours
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T09:00:00+09:00",
            end_time: "2024-01-15T13:00:00+09:00",
          },
          {
            start_time: "2024-01-15T15:00:00+09:00",
            end_time: "2024-01-15T19:00:00+09:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [],
      });
    });

    it("予約時間がUTC形式でも正しく処理される", async () => {
      // Mock booking with UTC time (should be converted to JST)
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T01:00:00Z", // UTC 01:00 = JST 10:00
            end_time: "2024-01-15T02:00:00Z", // UTC 02:00 = JST 11:00
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "10:00" },
          { start_time: "11:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });
  });

  describe("データベースエラーハンドリング", () => {
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("予約データ取得エラー時はエラーを投げる", async () => {
      const databaseError = new Error("Database connection failed");
      mockOrder.mockResolvedValue({
        data: null,
        error: databaseError,
      });

      await expect(() =>
        getAvailableTimeSlotsForDate(
          "2024-01-15",
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(databaseError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Bookings fetch error:",
        expect.objectContaining({
          name: databaseError.name,
          message: databaseError.message,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe("データベースクエリの検証", () => {
    it("正しいデータベースクエリが実行される", async () => {
      await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockFrom).toHaveBeenCalledWith("bookings");
      expect(mockSelect).toHaveBeenCalledWith("start_time, end_time");
      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
      expect(mockGte).toHaveBeenCalledWith(
        "start_time",
        new Date("2024-01-15T00:00:00+09:00").toISOString(),
      );
      expect(mockLte).toHaveBeenCalledWith(
        "start_time",
        new Date("2024-01-15T23:59:59.999+09:00").toISOString(),
      );
      expect(mockOrder).toHaveBeenCalledWith("start_time", { ascending: true });
    });

    it("論理削除された予約は除外される", async () => {
      await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
    });
  });

  describe("エッジケース", () => {
    it("月末の日付でも正常に動作する", async () => {
      // 2024-01-31 is Wednesday (should be closed)
      const result = await getAvailableTimeSlotsForDate(
        "2024-01-31",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [],
        message: "水曜日は休業日です",
      });
    });

    it("うるう年の日付でも正常に動作する", async () => {
      // 2024-02-29 is Thursday (should be open)
      const result = await getAvailableTimeSlotsForDate(
        "2024-02-29",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result.availableSlots).toEqual([
        { start_time: "09:00", end_time: "13:00" },
        { start_time: "15:00", end_time: "19:00" },
      ]);
    });

    it("年またぎの日付でも正常に動作する", async () => {
      // 2024-12-27 is Friday (should be open, before year-end restriction period)
      const result = await getAvailableTimeSlotsForDate(
        "2024-12-27",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result.availableSlots).toEqual([
        { start_time: "09:00", end_time: "13:00" },
        { start_time: "15:00", end_time: "19:00" },
      ]);
    });

    it("無効な日付文字列では例外が発生する", async () => {
      // Invalid date should throw an error
      await expect(
        getAvailableTimeSlotsForDate(
          "invalid-date",
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });
  });

  describe("時間帯別テスト", () => {
    it("営業時間の境界値でも正しく処理される", async () => {
      // Mock booking exactly at business hour boundaries
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T09:00:00+09:00", // Exactly at morning start
            end_time: "2024-01-15T09:30:00+09:00",
          },
          {
            start_time: "2024-01-15T18:30:00+09:00", // Near afternoon end
            end_time: "2024-01-15T19:00:00+09:00", // Exactly at afternoon end
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:30", end_time: "13:00" },
          { start_time: "15:00", end_time: "18:30" },
        ],
      });
    });

    it("営業時間外の予約は無視される", async () => {
      // Mock booking outside business hours
      mockOrder.mockResolvedValue({
        data: [
          {
            start_time: "2024-01-15T08:00:00+09:00", // Before business hours
            end_time: "2024-01-15T08:30:00+09:00",
          },
          {
            start_time: "2024-01-15T14:00:00+09:00", // During lunch break
            end_time: "2024-01-15T14:30:00+09:00",
          },
          {
            start_time: "2024-01-15T20:00:00+09:00", // After business hours
            end_time: "2024-01-15T20:30:00+09:00",
          },
        ],
        error: null,
      });

      const result = await getAvailableTimeSlotsForDate(
        "2024-01-15",
        mockSupabase as SupabaseClient<Database>,
      );

      // Should return full business hours since out-of-hours bookings are ignored
      expect(result).toEqual({
        availableSlots: [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      });
    });
  });
});
