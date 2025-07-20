/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";
import type { Database } from "@/types/database.types";
import { createBooking } from "../createBooking";

// Mock the availability check functions
vi.mock("../getAvailableTimeSlotsForDate", () => ({
  getAvailableTimeSlotsForDate: vi.fn(),
}));

vi.mock("../getIsAvailableTimeSlot", () => ({
  getIsAvailableTimeSlot: vi.fn(),
}));

import { getAvailableTimeSlotsForDate } from "../getAvailableTimeSlotsForDate";
import { getIsAvailableTimeSlot } from "../getIsAvailableTimeSlot";

const mockedGetAvailableTimeSlotsForDate =
  getAvailableTimeSlotsForDate as MockedFunction<
    typeof getAvailableTimeSlotsForDate
  >;
const mockedGetIsAvailableTimeSlot = getIsAvailableTimeSlot as MockedFunction<
  typeof getIsAvailableTimeSlot
>;

describe("createBooking", () => {
  let mockSupabase: Partial<SupabaseClient<Database>>;
  let mockFrom: ReturnType<typeof vi.fn>;

  const mockProfile = { id: 123 };
  const mockParams = {
    serviceId: 1,
    serviceName: "Test Service",
    servicePrice: 5000,
    serviceDuration: 60,
    date: "2024-01-15",
    startTime: "10:00",
    endTime: "11:00",
    notes: "Test booking notes",
  };

  const mockService = {
    id: 1,
    name: "Test Service",
    duration: 60,
    price: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockFrom = vi.fn();

    // Setup default mock behavior
    mockFrom.mockImplementation((table: string) => {
      if (table === "services") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockService, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "bookings") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: 1 }, error: null }),
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

    // Mock availability check functions
    mockedGetAvailableTimeSlotsForDate.mockResolvedValue({
      availableSlots: [
        { start_time: "09:00", end_time: "13:00" },
        { start_time: "15:00", end_time: "19:00" },
      ],
    });
    mockedGetIsAvailableTimeSlot.mockReturnValue(true);
  });

  describe("正常なケース", () => {
    it("有効なパラメータで予約を作成できる", async () => {
      const result = await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith("services");
      expect(mockFrom).toHaveBeenCalledWith("bookings");
    });

    it("正しい時間で予約を作成する", async () => {
      await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockedGetIsAvailableTimeSlot).toHaveBeenCalledWith(
        { start_time: "10:00", end_time: "11:00" },
        expect.any(Array),
      );
    });

    it("サービス情報のスナップショットを保存する", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: mockInsert,
          };
        }
        return {};
      });

      await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          service_info: {
            startTime: mockParams.startTime,
            endTime: mockParams.endTime,
            duration: mockParams.serviceDuration,
            price: mockParams.servicePrice,
          },
        }),
      );
    });

    it("空の備考欄でも予約を作成できる", async () => {
      const paramsWithEmptyNotes = {
        ...mockParams,
        notes: "",
      };

      const result = await createBooking(
        mockProfile,
        paramsWithEmptyNotes,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("最大長の備考欄でも予約を作成できる", async () => {
      const longNotes = "A".repeat(500);
      const paramsWithLongNotes = {
        ...mockParams,
        notes: longNotes,
      };

      const result = await createBooking(
        mockProfile,
        paramsWithLongNotes,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("serviceName が正しく保存される", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: mockInsert,
          };
        }
        return {};
      });

      await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          service_name: "Test Service",
        }),
      );
    });

    it("endTime が正しく保存される", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: mockInsert,
          };
        }
        return {};
      });

      await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          end_time: "2024-01-15T02:00:00.000Z", // 11:00 JST -> 02:00 UTC
        }),
      );
    });
  });

  describe("バリデーションエラー", () => {
    it("無効なサービスIDでエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        serviceId: "invalid" as any,
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("空のサービス名でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        serviceName: "",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("無効な日付でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        date: "invalid-date",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("無効な開始時間でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        startTime: "25:00",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("無効な終了時間でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        endTime: "25:00",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("2000文字を超える備考でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        notes: "A".repeat(2001),
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("空の日付でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        date: "",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("空の開始時間でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        startTime: "",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });

    it("空の終了時間でエラーが発生する", async () => {
      const invalidParams = {
        ...mockParams,
        endTime: "",
      };

      await expect(
        createBooking(
          mockProfile,
          invalidParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow();
    });
  });

  describe("サービス取得エラー", () => {
    it("存在しないサービスIDでエラーが発生する", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
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
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("サービスが見つかりません");
    });

    it("サービス取得でデータベースエラーが発生する", async () => {
      const databaseError = new Error("Database connection failed");
      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: databaseError }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(databaseError);
    });

    it("削除されたサービスは取得できない", async () => {
      const rlsError = new Error("RLS policy denied access");

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: rlsError,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // RLSポリシーによって削除されたサービスは取得できない
      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(rlsError);
    });
  });

  describe("サービス情報の検証", () => {
    it("入力データとサービス情報が一致しない場合エラーが発生する", async () => {
      const incorrectService = {
        id: mockParams.serviceId,
        name: "Different Service Name", // 異なるサービス名
        price: mockParams.servicePrice,
        duration: mockParams.serviceDuration,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: incorrectService,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("サービス情報が一致しません");
    });

    it("サービス価格が一致しない場合エラーが発生する", async () => {
      const incorrectService = {
        id: mockParams.serviceId,
        name: mockParams.serviceName,
        price: 9999, // 異なる価格
        duration: mockParams.serviceDuration,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: incorrectService,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("サービス情報が一致しません");
    });

    it("サービス時間が一致しない場合エラーが発生する", async () => {
      const incorrectParams = {
        ...mockParams,
        startTime: "10:00",
        endTime: "11:30", // 90分間（serviceDurationは60分）
      };

      await expect(
        createBooking(
          mockProfile,
          incorrectParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("サービス時間が一致しません");
    });

    it("開始時間と終了時間の差分が正しく計算される", async () => {
      const correctParams = {
        ...mockParams,
        startTime: "14:00",
        endTime: "15:00", // 60分間（serviceDurationと一致）
      };

      mockedGetIsAvailableTimeSlot.mockReturnValue(true);

      const result = await createBooking(
        mockProfile,
        correctParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });
  });

  describe("時間帯の可用性チェック", () => {
    it("利用できない時間帯でエラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockedGetIsAvailableTimeSlot.mockReturnValue(false);

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("指定された時間帯は利用できません");

      // Verify console.error was called with availability data
      expect(consoleSpy).toHaveBeenCalledWith({
        date: mockParams.date,
        start_time: mockParams.startTime,
        end_time: mockParams.endTime,
        availableSlots: expect.any(Array),
      });
      consoleSpy.mockRestore();
    });

    it("可用性チェックで正しいパラメータが使用される", async () => {
      await createBooking(
        mockProfile,
        mockParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(mockedGetAvailableTimeSlotsForDate).toHaveBeenCalledWith(
        "2024-01-15",
        mockSupabase,
      );
      expect(mockedGetIsAvailableTimeSlot).toHaveBeenCalledWith(
        { start_time: "10:00", end_time: "11:00" },
        [
          { start_time: "09:00", end_time: "13:00" },
          { start_time: "15:00", end_time: "19:00" },
        ],
      );
    });
  });

  describe("時間帯の境界値テスト", () => {
    it("午前の営業開始時刻で予約を作成できる", async () => {
      const morningParams = {
        ...mockParams,
        startTime: "09:00",
        endTime: "10:00",
      };

      const result = await createBooking(
        mockProfile,
        morningParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("午後の営業開始時刻で予約を作成できる", async () => {
      const afternoonParams = {
        ...mockParams,
        startTime: "15:00",
        endTime: "16:00",
      };

      const result = await createBooking(
        mockProfile,
        afternoonParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("営業終了間際で予約を作成できる", async () => {
      const lateParams = {
        ...mockParams,
        startTime: "18:00",
        endTime: "19:00",
      };

      const result = await createBooking(
        mockProfile,
        lateParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });
  });

  describe("エッジケース", () => {
    it("月末の日付で予約を作成できる", async () => {
      const monthEndParams = {
        ...mockParams,
        date: "2024-01-31",
      };

      const result = await createBooking(
        mockProfile,
        monthEndParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("うるう年の日付で予約を作成できる", async () => {
      const leapYearParams = {
        ...mockParams,
        date: "2024-02-29",
      };

      const result = await createBooking(
        mockProfile,
        leapYearParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("年またぎの日付で予約を作成できる", async () => {
      const yearEndParams = {
        ...mockParams,
        date: "2024-12-31",
      };

      const result = await createBooking(
        mockProfile,
        yearEndParams,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });

    it("備考欄の前後空白が削除される", async () => {
      const paramsWithWhitespace = {
        ...mockParams,
        notes: "  Test notes with spaces  ",
      };

      const result = await createBooking(
        mockProfile,
        paramsWithWhitespace,
        mockSupabase as SupabaseClient<Database>,
      );

      expect(result).toBeDefined();
    });
  });

  describe("データベース挿入エラー", () => {
    it("データベース挿入エラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const insertError = new Error("Database insert failed");

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: insertError }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(insertError);

      // Verify console.error was called with the error
      expect(consoleSpy).toHaveBeenCalledWith(insertError);
      consoleSpy.mockRestore();
    });

    it("予約データが返されない場合にエラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow("データが取得できませんでした");

      // Verify console.error was called with null
      expect(consoleSpy).toHaveBeenCalledWith(null);
      consoleSpy.mockRestore();
    });

    it("重複する予約で制約エラーが発生する", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const constraintError = new Error("Duplicate booking constraint");

      mockFrom.mockImplementation((table: string) => {
        if (table === "services") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockService, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: constraintError }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        createBooking(
          mockProfile,
          mockParams,
          mockSupabase as SupabaseClient<Database>,
        ),
      ).rejects.toThrow(constraintError);

      // Verify console.error was called with the error
      expect(consoleSpy).toHaveBeenCalledWith(constraintError);
      consoleSpy.mockRestore();
    });
  });
});
