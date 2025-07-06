/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { describe, expect, it, vi } from "vitest";
import { ROLE_CODES } from "@/constants/roleCode";
import { SEX_CODES } from "@/constants/sexCode";
import { createProfile, updateProfile } from "../profiles";

// Mock Supabase client helper for insert operations
const createMockSupabaseClient = (data: any = null, error: any = null) => ({
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        data,
        error,
      })),
    })),
  })),
});

// Mock Supabase client helper for update operations
const createMockSupabaseClientForUpdate = (
  data: any = null,
  error: any = null,
) => ({
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          data,
          error,
        })),
      })),
    })),
  })),
});

describe("createProfile", () => {
  const validUser = { user_id: "test-user-id" };
  const validParams = {
    name: "田中太郎",
    name_hiragana: "たなかたろう",
    sex: SEX_CODES.MALE,
    date_of_birth: "1990-01-01",
    role: ROLE_CODES.USER,
  };

  describe("正常なケース", () => {
    it("有効なプロフィールデータで正常に作成される", async () => {
      const expectedData = [
        {
          id: 1,
          user_id: "test-user-id",
          ...validParams,
        },
      ];
      const mockClient = createMockSupabaseClient(expectedData);

      const result = await createProfile(
        validUser,
        validParams,
        mockClient as any,
      );

      expect(result.data).toEqual(expectedData);
      expect(result.error).toBeNull();
      expect(mockClient.from).toHaveBeenCalledWith("profiles");
    });

    it("文字列の前後の空白が削除される", async () => {
      const paramsWithSpaces = {
        name: "  田中太郎  ",
        name_hiragana: "  たなかたろう  ",
        sex: SEX_CODES.MALE,
        date_of_birth: "1990-01-01",
        role: ROLE_CODES.USER,
      };

      const mockClient = {
        from: vi.fn(() => ({
          insert: vi.fn((data) => {
            expect(data.name).toBe("田中太郎");
            expect(data.name_hiragana).toBe("たなかたろう");
            return {
              select: vi.fn(() => ({
                data: [{ id: 1, ...data }],
                error: null,
              })),
            };
          }),
        })),
      };

      await createProfile(validUser, paramsWithSpaces, mockClient as any);
    });

    it("全ての性別コードで正常に作成される", async () => {
      const sexCodes = [
        SEX_CODES.MALE,
        SEX_CODES.FEMALE,
        SEX_CODES.NOT_KNOWN,
        SEX_CODES.NOT_APPLICABLE,
      ];

      for (const sex of sexCodes) {
        const params = { ...validParams, sex };
        const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

        const result = await createProfile(
          validUser,
          params,
          mockClient as any,
        );

        expect(result.data?.[0]).toMatchObject({ sex });
      }
    });

    it("全てのロールコードで正常に作成される", async () => {
      const roleCodes = [ROLE_CODES.USER, ROLE_CODES.ADMIN];

      for (const role of roleCodes) {
        const params = { ...validParams, role };
        const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

        const result = await createProfile(
          validUser,
          params,
          mockClient as any,
        );

        expect(result.data?.[0]).toMatchObject({ role });
      }
    });
  });

  describe("バリデーションエラー - 名前", () => {
    it("名前が空文字列の場合エラーを投げる", async () => {
      const params = { ...validParams, name: "" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が空白のみの場合エラーを投げる", async () => {
      const params = { ...validParams, name: "   " };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が1文字の場合エラーを投げる", async () => {
      const params = { ...validParams, name: "田" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が100文字を超える場合エラーを投げる", async () => {
      const longName = "田".repeat(101);
      const params = { ...validParams, name: longName };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は100文字以内で入力してください");
      }
    });

    it("名前が2文字ちょうどで正常に作成される", async () => {
      const params = { ...validParams, name: "田中" };
      const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

      const result = await createProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name: "田中" });
    });

    it("名前が100文字ちょうどで正常に作成される", async () => {
      const maxName = "田".repeat(100);
      const params = { ...validParams, name: maxName };
      const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

      const result = await createProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name: maxName });
    });
  });

  describe("バリデーションエラー - ひらがな名前", () => {
    it("ひらがな名前が空文字列の場合エラーを投げる", async () => {
      const params = { ...validParams, name_hiragana: "" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがな名前は2文字以上で入力してください");
      }
    });

    it("ひらがな名前が1文字の場合エラーを投げる", async () => {
      const params = { ...validParams, name_hiragana: "た" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがな名前は2文字以上で入力してください");
      }
    });

    it("ひらがな名前が100文字を超える場合エラーを投げる", async () => {
      const longName = "た".repeat(101);
      const params = { ...validParams, name_hiragana: longName };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "ひらがな名前は100文字以内で入力してください",
        );
      }
    });

    it("ひらがな名前にカタカナが含まれている場合エラーを投げる", async () => {
      const params = { ...validParams, name_hiragana: "たなかタロウ" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前に漢字が含まれている場合エラーを投げる", async () => {
      const params = { ...validParams, name_hiragana: "田中たろう" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前に英数字が含まれている場合エラーを投げる", async () => {
      const params = { ...validParams, name_hiragana: "たなかtaro" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前にスペースが含まれていても正常に作成される", async () => {
      const params = { ...validParams, name_hiragana: "たなか たろう" };
      const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

      const result = await createProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({
        name_hiragana: "たなか たろう",
      });
    });

    it("ひらがな名前に長音符が含まれていても正常に作成される", async () => {
      const params = { ...validParams, name_hiragana: "たなかー" };
      const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

      const result = await createProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name_hiragana: "たなかー" });
    });
  });

  describe("バリデーションエラー - 性別", () => {
    it("性別が文字列の場合エラーを投げる", async () => {
      const params = { ...validParams, sex: "male" as any };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });

    it("性別が無効な数値の場合エラーを投げる", async () => {
      const params = { ...validParams, sex: 99 as any };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });

    it("性別がnullの場合エラーを投げる", async () => {
      const params = { ...validParams, sex: null as any };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });
  });

  describe("バリデーションエラー - 生年月日", () => {
    it("生年月日が空文字列の場合エラーを投げる", async () => {
      const params = { ...validParams, date_of_birth: "" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は正しい日付形式で入力してください",
        );
      }
    });

    it("生年月日が無効な日付形式の場合エラーを投げる", async () => {
      const params = { ...validParams, date_of_birth: "1990/01/01" };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は正しい日付形式で入力してください",
        );
      }
    });

    it("生年月日が未来の日付の場合エラーを投げる", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const params = {
        ...validParams,
        date_of_birth: futureDate.toISOString().split("T")[0],
      };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は今日以前の日付を入力してください",
        );
      }
    });

    it("生年月日が今日の日付で正常に作成される", async () => {
      const today = new Date().toISOString().split("T")[0];
      const params = { ...validParams, date_of_birth: today };
      const mockClient = createMockSupabaseClient([{ id: 1, ...params }]);

      const result = await createProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ date_of_birth: today });
    });
  });

  describe("バリデーションエラー - ロール", () => {
    it("ロールが無効な文字列の場合エラーを投げる", async () => {
      const params = { ...validParams, role: "invalid_role" as any };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ロールは有効な値を選択してください");
      }
    });

    it("ロールが数値の場合エラーを投げる", async () => {
      const params = { ...validParams, role: 1 as any };
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("有効な値を選択してください");
      }
    });
  });

  describe("必須フィールドエラー", () => {
    it("名前が欠けている場合エラーを投げる", async () => {
      const params = { ...validParams };
      delete (params as any).name;
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params as any, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          'Invalid key: Expected "name" but received undefined',
        );
      }
    });

    it("ひらがな名前が欠けている場合エラーを投げる", async () => {
      const params = { ...validParams };
      delete (params as any).name_hiragana;
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params as any, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          'Invalid key: Expected "name_hiragana" but received undefined',
        );
      }
    });

    it("性別が欠けている場合エラーを投げる", async () => {
      const params = { ...validParams };
      delete (params as any).sex;
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params as any, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          'Invalid key: Expected "sex" but received undefined',
        );
      }
    });

    it("生年月日が欠けている場合エラーを投げる", async () => {
      const params = { ...validParams };
      delete (params as any).date_of_birth;
      const mockClient = createMockSupabaseClient();

      try {
        await createProfile(validUser, params as any, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          'Invalid key: Expected "date_of_birth" but received undefined',
        );
      }
    });
  });

  describe("データベースエラー", () => {
    it("データベースエラーが発生した場合エラーを投げる", async () => {
      const mockError = {
        message: "Database error",
        code: "42000",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      const result = await createProfile(
        validUser,
        validParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("制約違反エラーの場合適切なエラーを返す", async () => {
      const mockError = {
        message: "duplicate key value violates unique constraint",
        code: "23505",
        details: "Key (user_id)=(test-user-id) already exists.",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      const result = await createProfile(
        validUser,
        validParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("権限エラーの場合適切なエラーを返す", async () => {
      const mockError = {
        message: "permission denied for table profiles",
        code: "42501",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      const result = await createProfile(
        validUser,
        validParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });
});

describe("updateProfile", () => {
  const validUser = { user_id: "test-user-id" };
  const validUpdateParams = {
    name: "田中次郎",
    name_hiragana: "たなかじろう",
    sex: SEX_CODES.FEMALE,
    date_of_birth: "1985-05-15",
    role: ROLE_CODES.ADMIN,
  };

  describe("正常なケース", () => {
    it("全てのフィールドを更新できる", async () => {
      const expectedData = [
        {
          id: 1,
          user_id: "test-user-id",
          ...validUpdateParams,
        },
      ];
      const mockClient = createMockSupabaseClientForUpdate(expectedData);

      const result = await updateProfile(
        validUser,
        validUpdateParams,
        mockClient as any,
      );

      expect(result.data).toEqual(expectedData);
      expect(result.error).toBeNull();
      expect(mockClient.from).toHaveBeenCalledWith("profiles");
    });

    it("一部のフィールドのみ更新できる", async () => {
      const partialParams = { name: "田中花子" };
      const expectedData = [
        {
          id: 1,
          user_id: "test-user-id",
          name: "田中花子",
          name_hiragana: "たなかたろう",
          sex: SEX_CODES.MALE,
          date_of_birth: "1990-01-01",
          role: ROLE_CODES.USER,
        },
      ];
      const mockClient = createMockSupabaseClientForUpdate(expectedData);

      const result = await updateProfile(
        validUser,
        partialParams,
        mockClient as any,
      );

      expect(result.data).toEqual(expectedData);
      expect(result.error).toBeNull();
    });

    it("空のオブジェクトでも正常に処理される", async () => {
      const emptyParams = {};
      const expectedData = [
        {
          id: 1,
          user_id: "test-user-id",
          name: "田中太郎",
          name_hiragana: "たなかたろう",
          sex: SEX_CODES.MALE,
          date_of_birth: "1990-01-01",
          role: ROLE_CODES.USER,
        },
      ];
      const mockClient = createMockSupabaseClientForUpdate(expectedData);

      const result = await updateProfile(
        validUser,
        emptyParams,
        mockClient as any,
      );

      expect(result.data).toEqual(expectedData);
      expect(result.error).toBeNull();
    });

    it("文字列の前後の空白が削除される", async () => {
      const paramsWithSpaces = {
        name: "  田中三郎  ",
        name_hiragana: "  たなかさぶろう  ",
      };

      const mockClient = {
        from: vi.fn(() => ({
          update: vi.fn((data) => {
            expect(data.name).toBe("田中三郎");
            expect(data.name_hiragana).toBe("たなかさぶろう");
            return {
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  data: [{ id: 1, ...data }],
                  error: null,
                })),
              })),
            };
          }),
        })),
      };

      await updateProfile(validUser, paramsWithSpaces, mockClient as any);
    });

    it("全ての性別コードで正常に更新される", async () => {
      const sexCodes = [
        SEX_CODES.MALE,
        SEX_CODES.FEMALE,
        SEX_CODES.NOT_KNOWN,
        SEX_CODES.NOT_APPLICABLE,
      ];

      for (const sex of sexCodes) {
        const params = { sex };
        const mockClient = createMockSupabaseClientForUpdate([{ id: 1, sex }]);

        const result = await updateProfile(
          validUser,
          params,
          mockClient as any,
        );

        expect(result.data?.[0]).toMatchObject({ sex });
      }
    });

    it("全てのロールコードで正常に更新される", async () => {
      const roleCodes = [ROLE_CODES.USER, ROLE_CODES.ADMIN];

      for (const role of roleCodes) {
        const params = { role };
        const mockClient = createMockSupabaseClientForUpdate([{ id: 1, role }]);

        const result = await updateProfile(
          validUser,
          params,
          mockClient as any,
        );

        expect(result.data?.[0]).toMatchObject({ role });
      }
    });
  });

  describe("バリデーションエラー - 名前", () => {
    it("名前が空文字列の場合エラーを投げる", async () => {
      const params = { name: "" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が空白のみの場合エラーを投げる", async () => {
      const params = { name: "   " };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が1文字の場合エラーを投げる", async () => {
      const params = { name: "田" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は2文字以上で入力してください");
      }
    });

    it("名前が100文字を超える場合エラーを投げる", async () => {
      const longName = "田".repeat(101);
      const params = { name: longName };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("名前は100文字以内で入力してください");
      }
    });

    it("名前が2文字ちょうどで正常に更新される", async () => {
      const params = { name: "田中" };
      const mockClient = createMockSupabaseClientForUpdate([
        { id: 1, name: "田中" },
      ]);

      const result = await updateProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name: "田中" });
    });

    it("名前が100文字ちょうどで正常に更新される", async () => {
      const maxName = "田".repeat(100);
      const params = { name: maxName };
      const mockClient = createMockSupabaseClientForUpdate([
        { id: 1, name: maxName },
      ]);

      const result = await updateProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name: maxName });
    });
  });

  describe("バリデーションエラー - ひらがな名前", () => {
    it("ひらがな名前が空文字列の場合エラーを投げる", async () => {
      const params = { name_hiragana: "" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがな名前は2文字以上で入力してください");
      }
    });

    it("ひらがな名前が1文字の場合エラーを投げる", async () => {
      const params = { name_hiragana: "た" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがな名前は2文字以上で入力してください");
      }
    });

    it("ひらがな名前が100文字を超える場合エラーを投げる", async () => {
      const longName = "た".repeat(101);
      const params = { name_hiragana: longName };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "ひらがな名前は100文字以内で入力してください",
        );
      }
    });

    it("ひらがな名前にカタカナが含まれている場合エラーを投げる", async () => {
      const params = { name_hiragana: "たなかタロウ" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前に漢字が含まれている場合エラーを投げる", async () => {
      const params = { name_hiragana: "田中たろう" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前に英数字が含まれている場合エラーを投げる", async () => {
      const params = { name_hiragana: "たなかtaro" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ひらがなで入力してください");
      }
    });

    it("ひらがな名前にスペースが含まれていても正常に更新される", async () => {
      const params = { name_hiragana: "たなか たろう" };
      const mockClient = createMockSupabaseClientForUpdate([
        { id: 1, name_hiragana: "たなか たろう" },
      ]);

      const result = await updateProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({
        name_hiragana: "たなか たろう",
      });
    });

    it("ひらがな名前に長音符が含まれていても正常に更新される", async () => {
      const params = { name_hiragana: "たなかー" };
      const mockClient = createMockSupabaseClientForUpdate([
        { id: 1, name_hiragana: "たなかー" },
      ]);

      const result = await updateProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ name_hiragana: "たなかー" });
    });
  });

  describe("バリデーションエラー - 性別", () => {
    it("性別が文字列の場合エラーを投げる", async () => {
      const params = { sex: "male" as any };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });

    it("性別が無効な数値の場合エラーを投げる", async () => {
      const params = { sex: 99 as any };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });

    it("性別がnullの場合エラーを投げる", async () => {
      const params = { sex: null as any };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("性別は有効な値を選択してください");
      }
    });
  });

  describe("バリデーションエラー - 生年月日", () => {
    it("生年月日が空文字列の場合エラーを投げる", async () => {
      const params = { date_of_birth: "" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は正しい日付形式で入力してください",
        );
      }
    });

    it("生年月日が無効な日付形式の場合エラーを投げる", async () => {
      const params = { date_of_birth: "1990/01/01" };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は正しい日付形式で入力してください",
        );
      }
    });

    it("生年月日が未来の日付の場合エラーを投げる", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const params = {
        date_of_birth: futureDate.toISOString().split("T")[0],
      };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "生年月日は今日以前の日付を入力してください",
        );
      }
    });

    it("生年月日が今日の日付で正常に更新される", async () => {
      const today = new Date().toISOString().split("T")[0];
      const params = { date_of_birth: today };
      const mockClient = createMockSupabaseClientForUpdate([
        { id: 1, date_of_birth: today },
      ]);

      const result = await updateProfile(validUser, params, mockClient as any);

      expect(result.data?.[0]).toMatchObject({ date_of_birth: today });
    });
  });

  describe("バリデーションエラー - ロール", () => {
    it("ロールが無効な文字列の場合エラーを投げる", async () => {
      const params = { role: "invalid_role" as any };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("ロールは有効な値を選択してください");
      }
    });

    it("ロールが数値の場合エラーを投げる", async () => {
      const params = { role: 1 as any };
      const mockClient = createMockSupabaseClientForUpdate();

      try {
        await updateProfile(validUser, params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe("有効な値を選択してください");
      }
    });
  });

  describe("データベースエラー", () => {
    it("データベースエラーが発生した場合エラーを返す", async () => {
      const mockError = {
        message: "Database error",
        code: "42000",
      };
      const mockClient = createMockSupabaseClientForUpdate(null, mockError);

      const result = await updateProfile(
        validUser,
        validUpdateParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("制約違反エラーの場合適切なエラーを返す", async () => {
      const mockError = {
        message: "constraint violation error",
        code: "23505",
        details: "Constraint error details",
      };
      const mockClient = createMockSupabaseClientForUpdate(null, mockError);

      const result = await updateProfile(
        validUser,
        validUpdateParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("権限エラーの場合適切なエラーを返す", async () => {
      const mockError = {
        message: "permission denied for table profiles",
        code: "42501",
      };
      const mockClient = createMockSupabaseClientForUpdate(null, mockError);

      const result = await updateProfile(
        validUser,
        validUpdateParams,
        mockClient as any,
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("レコードが見つからない場合空の配列を返す", async () => {
      const mockClient = createMockSupabaseClientForUpdate([]);

      const result = await updateProfile(
        validUser,
        validUpdateParams,
        mockClient as any,
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});
