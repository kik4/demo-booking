/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { describe, expect, it, vi } from "vitest";
import { createServices } from "../services";

// Mock Supabase client helper
const createMockSupabaseClient = (data: any[] | null, error: any = null) => ({
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        data,
        error,
      })),
    })),
  })),
});

describe("createServices", () => {
  describe("正常なケース", () => {
    it("有効なサービスデータで正常に作成される", async () => {
      const params = [
        { name: "カット", duration: 60, price: 5000 },
        { name: "カラー", duration: 120, price: 8000 },
      ];

      const mockClient = createMockSupabaseClient([
        { id: 1, name: "カット", duration: 60, price: 5000 },
        { id: 2, name: "カラー", duration: 120, price: 8000 },
      ]);

      const result = await createServices(params, mockClient as any);

      expect(result).toEqual([
        { id: 1, name: "カット", duration: 60, price: 5000 },
        { id: 2, name: "カラー", duration: 120, price: 8000 },
      ]);
      expect(mockClient.from).toHaveBeenCalledWith("services");
    });

    it("単一のサービスでも正常に作成される", async () => {
      const params = [{ name: "シャンプー", duration: 30, price: 2000 }];

      const mockClient = createMockSupabaseClient([
        { id: 1, name: "シャンプー", duration: 30, price: 2000 },
      ]);

      const result = await createServices(params, mockClient as any);

      expect(result).toEqual([
        { id: 1, name: "シャンプー", duration: 30, price: 2000 },
      ]);
    });

    it("文字列の前後の空白が削除される", async () => {
      const params = [{ name: "  カット  ", duration: 60, price: 5000 }];

      const mockClient = {
        from: vi.fn(() => ({
          insert: vi.fn((data) => {
            expect(data[0].name).toBe("カット");
            return {
              select: vi.fn(() => ({
                data: [{ id: 1, name: "カット", duration: 60, price: 5000 }],
                error: null,
              })),
            };
          }),
        })),
      };

      await createServices(params, mockClient as any);
    });
  });

  describe("バリデーションエラー", () => {
    it("名前が空文字列の場合エラーを投げる", async () => {
      const params = [{ name: "", duration: 60, price: 5000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid length: Expected >=1 but received 0",
        );
        expect(error.issues).toHaveLength(1);
        expect(error.issues[0]).toMatchObject({
          type: "min_length",
          kind: "validation",
          expected: ">=1",
          received: "0",
        });
        // パス情報をチェック：配列の0番目のオブジェクトのnameフィールドでエラー
        expect(error.issues[0].path).toHaveLength(2);
        expect(error.issues[0].path[1].key).toBe("name");
      }
    });

    it("名前が空白のみの場合エラーを投げる", async () => {
      const params = [{ name: "   ", duration: 60, price: 5000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid length: Expected >=1 but received 0",
        );
        expect(error.issues[0]).toMatchObject({
          type: "min_length",
          kind: "validation",
        });
        expect(error.issues[0].path[1].key).toBe("name");
      }
    });

    it("名前が100文字を超える場合エラーを投げる", async () => {
      const longName = "a".repeat(101);
      const params = [{ name: longName, duration: 60, price: 5000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid length: Expected <=100 but received 101",
        );
        expect(error.issues[0]).toMatchObject({
          type: "max_length",
          kind: "validation",
          expected: "<=100",
          received: "101",
        });
        expect(error.issues[0].path[1].key).toBe("name");
      }
    });

    it("duration が0以下の場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 0, price: 5000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid value: Expected >=1 but received 0",
        );
        expect(error.issues[0]).toMatchObject({
          type: "min_value",
          kind: "validation",
          expected: ">=1",
          received: "0",
        });
        expect(error.issues[0].path[1].key).toBe("duration");
      }
    });

    it("duration が負数の場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: -10, price: 5000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid value: Expected >=1 but received -10",
        );
        expect(error.issues[0]).toMatchObject({
          type: "min_value",
          kind: "validation",
          expected: ">=1",
          received: "-10",
        });
        expect(error.issues[0].path[1].key).toBe("duration");
      }
    });

    it("price が100未満の場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: 99 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid value: Expected >=100 but received 99",
        );
        expect(error.issues[0]).toMatchObject({
          type: "min_value",
          kind: "validation",
          expected: ">=100",
          received: "99",
        });
        expect(error.issues[0].path[1].key).toBe("price");
      }
    });

    it("price が負数の場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: -1000 }];
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid value: Expected >=100 but received -1000",
        );
        expect(error.issues[0]).toMatchObject({
          type: "min_value",
          kind: "validation",
          expected: ">=100",
          received: "-1000",
        });
        expect(error.issues[0].path[1].key).toBe("price");
      }
    });

    it("必須フィールドが欠けている場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60 }] as any;
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          'Invalid key: Expected "price" but received undefined',
        );
        expect(error.issues[0]).toMatchObject({
          type: "object",
          kind: "schema",
          expected: '"price"',
          received: "undefined",
        });
        expect(error.issues[0].path[1].key).toBe("price");
      }
    });

    it("型が不正な場合エラーを投げる", async () => {
      const params = [{ name: 123, duration: "60", price: "5000" }] as any;
      const mockClient = createMockSupabaseClient([]);

      try {
        await createServices(params, mockClient as any);
        expect.fail("エラーが投げられるべき");
      } catch (error: any) {
        expect(error.constructor.name).toBe("ValiError");
        expect(error.message).toBe(
          "Invalid type: Expected string but received 123",
        );
        expect(error.issues[0]).toMatchObject({
          type: "string",
          kind: "schema",
          expected: "string",
          received: "123",
        });
        expect(error.issues[0].path[1].key).toBe("name");
      }
    });
  });

  describe("データベースエラー", () => {
    it("データベースエラーが発生した場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: 5000 }];
      const mockError = {
        message: "Database error",
        code: "42000",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      await expect(createServices(params, mockClient as any)).rejects.toEqual(
        mockError,
      );
    });

    it("データが返されない場合エラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: 5000 }];
      const mockClient = createMockSupabaseClient(null, null);

      await expect(createServices(params, mockClient as any)).rejects.toEqual(
        null,
      );
    });

    it("制約違反エラーの場合適切なエラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: 5000 }];
      const mockError = {
        message: "duplicate key value violates unique constraint",
        code: "23505",
        details: "Key (name)=(カット) already exists.",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      await expect(createServices(params, mockClient as any)).rejects.toEqual(
        mockError,
      );
    });

    it("権限エラーの場合適切なエラーを投げる", async () => {
      const params = [{ name: "カット", duration: 60, price: 5000 }];
      const mockError = {
        message: "permission denied for table services",
        code: "42501",
      };
      const mockClient = createMockSupabaseClient(null, mockError);

      await expect(createServices(params, mockClient as any)).rejects.toEqual(
        mockError,
      );
    });
  });

  describe("エッジケース", () => {
    it("空配列の場合は空配列を返す", async () => {
      const params: any[] = [];
      const mockClient = createMockSupabaseClient([]);

      const result = await createServices(params, mockClient as any);
      expect(result).toEqual([]);
    });

    it("最小値の duration (1) で正常に作成される", async () => {
      const params = [{ name: "クイックカット", duration: 1, price: 1000 }];
      const mockClient = createMockSupabaseClient([
        { id: 1, name: "クイックカット", duration: 1, price: 1000 },
      ]);

      const result = await createServices(params, mockClient as any);
      expect(result).toEqual([
        { id: 1, name: "クイックカット", duration: 1, price: 1000 },
      ]);
    });

    it("最小値の price (100) で正常に作成される", async () => {
      const params = [{ name: "ミニサービス", duration: 15, price: 100 }];
      const mockClient = createMockSupabaseClient([
        { id: 1, name: "ミニサービス", duration: 15, price: 100 },
      ]);

      const result = await createServices(params, mockClient as any);
      expect(result).toEqual([
        { id: 1, name: "ミニサービス", duration: 15, price: 100 },
      ]);
    });

    it("最大長の name (100文字) で正常に作成される", async () => {
      const maxName = "a".repeat(100);
      const params = [{ name: maxName, duration: 60, price: 5000 }];
      const mockClient = createMockSupabaseClient([
        { id: 1, name: maxName, duration: 60, price: 5000 },
      ]);

      const result = await createServices(params, mockClient as any);
      expect(result).toEqual([
        { id: 1, name: maxName, duration: 60, price: 5000 },
      ]);
    });

    it("大きな数値の duration と price で正常に作成される", async () => {
      const params = [{ name: "VIPサービス", duration: 999999, price: 999999 }];
      const mockClient = createMockSupabaseClient([
        { id: 1, name: "VIPサービス", duration: 999999, price: 999999 },
      ]);

      const result = await createServices(params, mockClient as any);
      expect(result).toEqual([
        { id: 1, name: "VIPサービス", duration: 999999, price: 999999 },
      ]);
    });
  });
});
