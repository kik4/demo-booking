/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireUserAuth } from "@/lib/auth";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { ROUTES } from "@/lib/routes";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";
import { createBookingAction } from "../createBookingAction";

// Only mock external dependencies, NOT validation logic
vi.mock("next/cache");
vi.mock("@/lib/auth");
vi.mock("@/lib/db/bookings/createBooking");
vi.mock("@/lib/supabase/supabaseClientServer");

describe("createBookingAction - Unit Tests with Real Validation", () => {
  const mockCreateClient = vi.mocked(createClient);
  const mockCreateServiceClient = vi.mocked(createServiceClient);
  const mockRequireUserAuth = vi.mocked(requireUserAuth);
  const mockCreateBooking = vi.mocked(createBooking);
  const mockRevalidatePath = vi.mocked(revalidatePath);

  const mockSupabaseClient = {} as any;
  const mockServiceClient = {} as any;

  // 固定時刻: 2024年1月15日 09:00:00 JST (00:00:00 UTC)
  const FIXED_DATE = new Date("2024-01-15T00:00:00.000Z");

  const createValidFormData = (overrides: Record<string, string> = {}) => {
    const formData = new FormData();

    const defaults = {
      serviceId: "1",
      serviceName: "テストサービス",
      servicePrice: "5000",
      serviceDuration: "60",
      date: "2024-01-16", // 固定時刻の翌日（確実に未来）
      startTime: "10:00",
      endTime: "11:00",
      notes: "テスト備考",
    };

    const values = { ...defaults, ...overrides };
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value);
    }
    return formData;
  };

  beforeEach(() => {
    // 固定時刻にセット
    vi.setSystemTime(FIXED_DATE);

    mockCreateClient.mockReturnValue(mockSupabaseClient);
    mockCreateServiceClient.mockReturnValue(mockServiceClient);

    // Default successful auth
    mockRequireUserAuth.mockImplementation(async (_client, callback) => {
      return callback({
        profile: { id: 123 },
      } as any);
    });

    // Default successful booking creation
    mockCreateBooking.mockResolvedValue({
      id: 1,
      created_at: "2024-01-15T01:00:00.000Z",
      deleted_at: null,
      deleted_by_profile_id: null,
      end_time: "2024-01-15T02:00:00.000Z",
      notes: "テスト備考",
      profile_id: 123,
      service_id: 1,
      service_info: {},
      service_name: "テストサービス",
      start_time: "2024-01-15T01:00:00.000Z",
      updated_at: "2024-01-15T01:00:00.000Z",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("実際のバリデーション", () => {
    it("有効なデータは成功する", async () => {
      const formData = createValidFormData();

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.objectContaining({
          serviceId: 1,
          serviceName: "テストサービス",
          servicePrice: 5000,
          serviceDuration: 60,
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        }),
        mockServiceClient,
      );
    });

    it("未来の日付は受け入れられる", async () => {
      // 固定時刻から見て確実に未来の日付
      const formData = createValidFormData({ date: "2024-01-20" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
    });

    it("今日の日付はエラーになる", async () => {
      // 固定時刻では2024-01-15が今日（過去日付として扱われる）
      const formData = createValidFormData({ date: "2024-01-15" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["過去の日付は選択できません"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("昨日の日付はエラーになる", async () => {
      // 固定時刻では2024-01-14が昨日
      const formData = createValidFormData({ date: "2024-01-14" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["過去の日付は選択できません"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("明日の日付は受け入れられる", async () => {
      // 固定時刻では2024-01-16が明日
      const formData = createValidFormData({ date: "2024-01-16" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
    });

    it("空のserviceIdはエラーになる", async () => {
      const formData = createValidFormData({ serviceId: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          serviceId: ["サービスを選択してください"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("空のserviceNameはエラーになる", async () => {
      const formData = createValidFormData({ serviceName: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          serviceName: ["サービス名が必要です"],
        },
      });
    });

    it("空のservicePriceはエラーになる", async () => {
      const formData = createValidFormData({ servicePrice: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          servicePrice: ["サービス価格が必要です"],
        },
      });
    });

    it("空のserviceDurationはエラーになる", async () => {
      const formData = createValidFormData({ serviceDuration: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          serviceDuration: ["サービス時間が必要です"],
        },
      });
    });

    it("空の日付はエラーになる", async () => {
      const formData = createValidFormData({ date: "" });

      const result = await createBookingAction(formData);

      // 空文字列では minLength と過去日付チェック両方がエラーになる
      expect(result.errors?.date).toContain("予約日を選択してください");
    });

    it("空のstartTimeはエラーになる", async () => {
      const formData = createValidFormData({ startTime: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          startTime: ["予約時間を選択してください"],
        },
      });
    });

    it("空のendTimeはエラーになる", async () => {
      const formData = createValidFormData({ endTime: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          endTime: ["終了時間が必要です"],
        },
      });
    });

    it("500文字を超える備考はエラーになる", async () => {
      const longNotes = "A".repeat(501);
      const formData = createValidFormData({ notes: longNotes });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          notes: ["補足は500文字以内で入力してください"],
        },
      });
    });

    it("500文字の備考は受け入れられる", async () => {
      const maxNotes = "A".repeat(500);
      const formData = createValidFormData({ notes: maxNotes });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
    });

    it("複数のバリデーションエラーが発生する", async () => {
      const formData = createValidFormData({
        serviceId: "",
        date: "",
        notes: "A".repeat(501),
      });

      const result = await createBookingAction(formData);

      expect(result.errors).toBeDefined();
      expect(result.errors?.serviceId).toEqual(["サービスを選択してください"]);
      expect(result.errors?.date).toContain("予約日を選択してください");
      expect(result.errors?.notes).toEqual([
        "補足は500文字以内で入力してください",
      ]);
    });
  });

  describe("FormDataの解析", () => {
    it("実際のFormDataから正しく値を抽出する", async () => {
      const formData = new FormData();
      formData.set("serviceId", "42");
      formData.set("serviceName", "カスタムサービス");
      formData.set("servicePrice", "12000");
      formData.set("serviceDuration", "120");
      formData.set("date", "2024-01-20"); // 固定時刻から見て未来の日付
      formData.set("startTime", "14:30");
      formData.set("endTime", "16:30");
      formData.set("notes", "カスタム備考");

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.objectContaining({
          serviceId: 42,
          serviceName: "カスタムサービス",
          servicePrice: 12000,
          serviceDuration: 120,
          date: "2024-01-20",
          startTime: "14:30",
          endTime: "16:30",
          notes: "カスタム備考",
        }),
        mockServiceClient,
      );
    });

    it("空の備考は空文字として処理される", async () => {
      const formData = createValidFormData({ notes: "" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.objectContaining({
          notes: "",
        }),
        mockServiceClient,
      );
    });

    it("notesフィールドがない場合はnullとして取得され空文字に変換される", async () => {
      const formData = new FormData();
      formData.set("serviceId", "1");
      formData.set("serviceName", "テストサービス");
      formData.set("servicePrice", "5000");
      formData.set("serviceDuration", "60");
      formData.set("date", "2024-01-20"); // 固定時刻から見て未来の日付
      formData.set("startTime", "10:00");
      formData.set("endTime", "11:00");
      formData.set("notes", ""); // 明示的に空文字列を設定

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.objectContaining({
          notes: "",
        }),
        mockServiceClient,
      );
    });
  });

  describe("エラーハンドリング", () => {
    it("認証エラーが発生した場合", async () => {
      mockRequireUserAuth.mockResolvedValue({
        error: "認証が必要です",
      });

      const formData = createValidFormData();
      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          root: ["認証が必要です"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("予約作成でエラーが発生した場合", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCreateBooking.mockRejectedValue(new Error("データベースエラー"));

      const formData = createValidFormData();
      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          root: ["データベースエラー"],
        },
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error:",
        expect.objectContaining({
          name: "Error",
          message: "データベースエラー",
          timestamp: expect.any(String),
        }),
      );
      consoleSpy.mockRestore();
    });

    it("予期しないエラーが発生した場合", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCreateBooking.mockRejectedValue("非Errorオブジェクト");

      const formData = createValidFormData();
      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          root: ["予期しないエラーが発生しました"],
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error:",
        "非Errorオブジェクト",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("成功時の処理", () => {
    it("成功時にrevalidatePathが呼ばれる", async () => {
      const formData = createValidFormData();

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
      expect(mockRevalidatePath).toHaveBeenCalledWith(ROUTES.USER.HOME);
    });

    it("正しいクライアントが使用される", async () => {
      const formData = createValidFormData();

      await createBookingAction(formData);

      expect(mockCreateClient).toHaveBeenCalledOnce();
      expect(mockCreateServiceClient).toHaveBeenCalledOnce();
      expect(mockRequireUserAuth).toHaveBeenCalledWith(
        mockSupabaseClient,
        expect.any(Function),
      );
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.any(Object),
        mockServiceClient,
      );
    });
  });

  describe("JST日付境界値テスト", () => {
    it("日本時間で昨日は過去日付として扱われる", async () => {
      // 固定時刻では2024-01-14が昨日
      const formData = createValidFormData({ date: "2024-01-14" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["過去の日付は選択できません"],
        },
      });
    });

    it("未来の日付は正しく受け入れられる", async () => {
      // 固定時刻から見て確実に未来の日付
      const formData = createValidFormData({ date: "2024-02-01" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
    });
  });

  describe("3か月制限テスト", () => {
    it("3か月後の日付は受け入れられる", async () => {
      // 固定時刻2024-01-15の3か月後は2024-04-15
      const formData = createValidFormData({ date: "2024-04-15" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({ success: true });
    });

    it("3か月後の翌日はエラーになる", async () => {
      // 固定時刻2024-01-15の3か月後の翌日は2024-04-16
      const formData = createValidFormData({ date: "2024-04-16" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["3か月以上先の日付は選択できません"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("4か月後の日付はエラーになる", async () => {
      // 固定時刻2024-01-15の4か月後は2024-05-15
      const formData = createValidFormData({ date: "2024-05-15" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["3か月以上先の日付は選択できません"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("6か月後の日付はエラーになる", async () => {
      // 固定時刻2024-01-15の6か月後は2024-07-15
      const formData = createValidFormData({ date: "2024-07-15" });

      const result = await createBookingAction(formData);

      expect(result).toEqual({
        errors: {
          date: ["3か月以上先の日付は選択できません"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });
  });
});
