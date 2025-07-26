/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireUserAuth } from "@/lib/auth";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { ROUTES } from "@/lib/routes";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";
import { createBookingAction } from "../createBookingAction";

vi.mock("next/cache");
vi.mock("valibot");
vi.mock("@/lib/auth");
vi.mock("@/lib/db/bookings/createBooking");
vi.mock("@/lib/supabase/supabaseClientServer");

describe("createBookingAction", () => {
  const mockCreateClient = vi.mocked(createClient);
  const mockCreateServiceClient = vi.mocked(createServiceClient);
  const mockRequireUserAuth = vi.mocked(requireUserAuth);
  const mockCreateBooking = vi.mocked(createBooking);
  const mockRevalidatePath = vi.mocked(revalidatePath);
  const mockSafeParse = vi.mocked(v.safeParse);

  const mockSupabaseClient = {} as any;
  const mockServiceClient = {} as any;

  const validFormData = new FormData();
  validFormData.set("serviceId", "1");
  validFormData.set("serviceName", "テストサービス");
  validFormData.set("servicePrice", "5000");
  validFormData.set("serviceDuration", "60");
  validFormData.set("date", "2024-01-15");
  validFormData.set("startTime", "10:00");
  validFormData.set("endTime", "11:00");
  validFormData.set("notes", "テスト備考");

  beforeEach(() => {
    mockCreateClient.mockReturnValue(mockSupabaseClient);
    mockCreateServiceClient.mockReturnValue(mockServiceClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("正常なケース", () => {
    it("有効なFormDataで予約を作成できる", async () => {
      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

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

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({ success: true });
      expect(mockCreateClient).toHaveBeenCalledOnce();
      expect(mockCreateServiceClient).toHaveBeenCalledOnce();
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        {
          serviceId: 1,
          serviceName: "テストサービス",
          servicePrice: 5000,
          serviceDuration: 60,
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        mockServiceClient,
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith(ROUTES.USER.HOME);
    });

    it("備考が空文字の場合でも予約を作成できる", async () => {
      const formDataWithEmptyNotes = new FormData();
      formDataWithEmptyNotes.set("serviceId", "1");
      formDataWithEmptyNotes.set("serviceName", "テストサービス");
      formDataWithEmptyNotes.set("servicePrice", "5000");
      formDataWithEmptyNotes.set("serviceDuration", "60");
      formDataWithEmptyNotes.set("date", "2024-01-15");
      formDataWithEmptyNotes.set("startTime", "10:00");
      formDataWithEmptyNotes.set("endTime", "11:00");
      formDataWithEmptyNotes.set("notes", "");

      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

      mockCreateBooking.mockResolvedValue({
        id: 1,
        created_at: "2024-01-15T01:00:00.000Z",
        deleted_at: null,
        deleted_by_profile_id: null,
        end_time: "2024-01-15T02:00:00.000Z",
        notes: "",
        profile_id: 123,
        service_id: 1,
        service_info: {},
        service_name: "テストサービス",
        start_time: "2024-01-15T01:00:00.000Z",
        updated_at: "2024-01-15T01:00:00.000Z",
      });

      const result = await createBookingAction(formDataWithEmptyNotes);

      expect(result).toEqual({ success: true });
      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        expect.objectContaining({
          notes: "",
        }),
        mockServiceClient,
      );
    });

    it("notesがnullまたはundefinedの場合は空文字として処理される", async () => {
      const formDataWithNullNotes = new FormData();
      formDataWithNullNotes.set("serviceId", "1");
      formDataWithNullNotes.set("serviceName", "テストサービス");
      formDataWithNullNotes.set("servicePrice", "5000");
      formDataWithNullNotes.set("serviceDuration", "60");
      formDataWithNullNotes.set("date", "2024-01-15");
      formDataWithNullNotes.set("startTime", "10:00");
      formDataWithNullNotes.set("endTime", "11:00");

      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: null as any,
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

      mockCreateBooking.mockResolvedValue({
        id: 1,
        created_at: "2024-01-15T01:00:00.000Z",
        deleted_at: null,
        deleted_by_profile_id: null,
        end_time: "2024-01-15T02:00:00.000Z",
        notes: "",
        profile_id: 123,
        service_id: 1,
        service_info: {},
        service_name: "テストサービス",
        start_time: "2024-01-15T01:00:00.000Z",
        updated_at: "2024-01-15T01:00:00.000Z",
      });

      const result = await createBookingAction(formDataWithNullNotes);

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

  describe("バリデーションエラー", () => {
    it("スキーマバリデーションに失敗した場合はエラーを返す", async () => {
      mockSafeParse.mockReturnValue({
        typed: false,
        success: false,
        issues: [
          {
            path: [{ key: "serviceId" }],
            message: "サービスを選択してください",
          },
          {
            path: [{ key: "date" }],
            message: "予約日を選択してください",
          },
        ],
      } as any);

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        errors: {
          serviceId: ["サービスを選択してください"],
          date: ["予約日を選択してください"],
        },
      });
      expect(mockRequireUserAuth).not.toHaveBeenCalled();
      expect(mockCreateBooking).not.toHaveBeenCalled();
    });

    it("過去の日付バリデーションエラーを正しく処理する", async () => {
      mockSafeParse.mockReturnValue({
        typed: false,
        success: false,
        issues: [
          {
            path: [{ key: "date" }],
            message: "過去の日付は選択できません",
          },
        ],
      } as any);

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        errors: {
          date: ["過去の日付は選択できません"],
        },
      });
    });

    it("複数のバリデーションエラーを正しく処理する", async () => {
      mockSafeParse.mockReturnValue({
        typed: false,
        success: false,
        issues: [
          {
            path: [{ key: "serviceId" }],
            message: "サービスを選択してください",
          },
          {
            path: [{ key: "serviceId" }],
            message: "無効なサービスIDです",
          },
          {
            path: [{ key: "notes" }],
            message: "補足は500文字以内で入力してください",
          },
        ],
      } as any);

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        errors: {
          serviceId: ["サービスを選択してください", "無効なサービスIDです"],
          notes: ["補足は500文字以内で入力してください"],
        },
      });
    });

    it("pathがない場合はrootエラーとして処理する", async () => {
      mockSafeParse.mockReturnValue({
        typed: false,
        success: false,
        issues: [
          {
            path: null,
            message: "一般的なバリデーションエラー",
          },
        ],
      } as any);

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        errors: {
          root: ["一般的なバリデーションエラー"],
        },
      });
    });
  });

  describe("認証エラー", () => {
    it("認証に失敗した場合はエラーを返す", async () => {
      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockResolvedValue({
        error: "認証が必要です",
      });

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        errors: {
          root: ["認証が必要です"],
        },
      });
      expect(mockCreateBooking).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("requireUserAuthがsuccessフラグfalseを返した場合", async () => {
      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

      mockRequireUserAuth.mockResolvedValue({
        success: false,
        errors: {
          root: ["認証エラー"],
        },
      } as any);

      const result = await createBookingAction(validFormData);

      expect(result).toEqual({
        success: false,
        errors: {
          root: ["認証エラー"],
        },
      });
    });
  });

  describe("予約作成エラー", () => {
    it("createBookingでエラーが発生した場合", async () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

      const bookingError = new Error("データベースエラー");
      mockCreateBooking.mockRejectedValue(bookingError);

      const result = await createBookingAction(validFormData);

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

      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

      mockCreateBooking.mockRejectedValue("非Errorオブジェクト");

      const result = await createBookingAction(validFormData);

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

  describe("FormDataの解析", () => {
    it("数値フィールドが正しく解析される", async () => {
      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

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

      await createBookingAction(validFormData);

      expect(mockCreateBooking).toHaveBeenCalledWith(
        { id: 123 },
        {
          serviceId: 1,
          serviceName: "テストサービス",
          servicePrice: 5000,
          serviceDuration: 60,
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        mockServiceClient,
      );
    });

    it("必要なFormDataフィールドがすべて抽出される", async () => {
      const formData = validFormData;

      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {} as any,
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

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

      await createBookingAction(formData);

      expect(mockSafeParse).toHaveBeenCalledWith(expect.objectContaining({}), {
        serviceId: "1",
        serviceName: "テストサービス",
        servicePrice: "5000",
        serviceDuration: "60",
        date: "2024-01-15",
        startTime: "10:00",
        endTime: "11:00",
        notes: "テスト備考",
      });
    });
  });

  describe("クライアント作成", () => {
    it("正しいクライアントが作成される", async () => {
      mockSafeParse.mockReturnValue({
        typed: true,
        success: true,
        output: {
          serviceId: "1",
          serviceName: "テストサービス",
          servicePrice: "5000",
          serviceDuration: "60",
          date: "2024-01-15",
          startTime: "10:00",
          endTime: "11:00",
          notes: "テスト備考",
        },
        issues: undefined,
      } as any);

      mockRequireUserAuth.mockImplementation(async (_client, callback) => {
        return callback({
          profile: { id: 123 },
        } as any);
      });

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

      await createBookingAction(validFormData);

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
});
