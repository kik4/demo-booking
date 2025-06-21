import { afterEach, describe, expect, it } from "vitest";
import {
  cleanupTestData,
  generateTestId,
  multiClientManager,
} from "../lib/supabaseTestClient";

describe("Users RLS (Row Level Security)", () => {
  afterEach(async () => {
    // テストデータをクリーンアップ
    await cleanupTestData();
    await multiClientManager.cleanup();
  });

  describe("ユーザーの作成と読み取り", () => {
    it("認証されたユーザーが自分のデータを作成できる", async () => {
      // テストユーザーを作成
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      // ユーザーでサインイン
      const { client: authenticatedClient, user } =
        await multiClientManager.createAndSignInUser(testId, email, password);

      // usersテーブルにレコードを作成
      const userRecord = {
        id: `user_${testId}`,
        user_id: user.id,
      };

      const { data, error } = await authenticatedClient
        .from("users")
        .insert(userRecord)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data) {
        expect(data.id).toBe(userRecord.id);
        expect(data.user_id).toBe(user.id);
      }
    });

    it("認証されたユーザーが自分のデータのみを読み取れる", async () => {
      // 2つのテストユーザーを作成
      const testId1 = generateTestId();
      const testId2 = generateTestId();
      const email1 = `test-${testId1}@example.com`;
      const email2 = `test-${testId2}@example.com`;
      const password = "testpassword123";

      const { client: authenticatedClient1, user: user1 } =
        await multiClientManager.createAndSignInUser(testId1, email1, password);
      const { client: authenticatedClient2, user: user2 } =
        await multiClientManager.createAndSignInUser(testId2, email2, password);

      // サービスロールクライアントで両方のユーザーのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const userRecord1 = {
        id: `user_${testId1}`,
        user_id: user1.id,
      };
      const userRecord2 = {
        id: `user_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient.from("users").insert([userRecord1, userRecord2]);

      // user1でサインインして自分のデータのみ取得できることを確認
      const { data: user1Data, error: user1Error } = await authenticatedClient1
        .from("users")
        .select("*");

      expect(user1Error).toBeNull();
      expect(user1Data).toBeDefined();
      if (user1Data) {
        expect(user1Data).toHaveLength(1);
        expect(user1Data[0].id).toBe(userRecord1.id);
        expect(user1Data[0].user_id).toBe(user1.id);
      }

      // user2でサインインして自分のデータのみ取得できることを確認
      const { data: user2Data, error: user2Error } = await authenticatedClient2
        .from("users")
        .select("*");

      expect(user2Error).toBeNull();
      expect(user2Data).toBeDefined();
      if (user2Data) {
        expect(user2Data).toHaveLength(1);
        expect(user2Data[0].id).toBe(userRecord2.id);
        expect(user2Data[0].user_id).toBe(user2.id);
      }
    });

    it("認証されたユーザーが他のユーザーのデータを直接取得できない", async () => {
      // 2つのテストユーザーを作成
      const testId1 = generateTestId();
      const testId2 = generateTestId();
      const email1 = `test-${testId1}@example.com`;
      const email2 = `test-${testId2}@example.com`;
      const password = "testpassword123";

      const { client: authenticatedClient1, user: user1 } =
        await multiClientManager.createAndSignInUser(testId1, email1, password);
      const { client: authenticatedClient2, user: user2 } =
        await multiClientManager.createAndSignInUser(testId2, email2, password);

      // サービスロールクライアントで両方のユーザーのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const userRecord1 = {
        id: `user_${testId1}`,
        user_id: user1.id,
      };
      const userRecord2 = {
        id: `user_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient.from("users").insert([userRecord1, userRecord2]);

      // user2のIDで直接検索しても取得できないことを確認
      const { data: directAccessData, error: directAccessError } =
        await authenticatedClient1
          .from("users")
          .select("*")
          .eq("id", userRecord2.id);

      expect(directAccessError).toBeNull();
      expect(directAccessData).toBeDefined();
      expect(directAccessData).toHaveLength(0); // RLSにより0件が返される

      // user2のuser_idで検索しても取得できないことを確認
      const { data: userIdAccessData, error: userIdAccessError } =
        await authenticatedClient1
          .from("users")
          .select("*")
          .eq("user_id", user2.id);

      expect(userIdAccessError).toBeNull();
      expect(userIdAccessData).toBeDefined();
      expect(userIdAccessData).toHaveLength(0); // RLSにより0件が返される
    });

    it("サービスロールクライアントは全てのデータにアクセスできる", async () => {
      // 2つのテストユーザーを作成
      const testId1 = generateTestId();
      const testId2 = generateTestId();
      const email1 = `test-${testId1}@example.com`;
      const email2 = `test-${testId2}@example.com`;
      const password = "testpassword123";

      const { user: user1 } = await multiClientManager.createAndSignInUser(
        testId1,
        email1,
        password,
      );
      const { user: user2 } = await multiClientManager.createAndSignInUser(
        testId2,
        email2,
        password,
      );

      // サービスロールクライアントで両方のユーザーのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const userRecord1 = {
        id: `user_${testId1}`,
        user_id: user1.id,
      };
      const userRecord2 = {
        id: `user_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient.from("users").insert([userRecord1, userRecord2]);

      // サービスロールクライアントで全てのテストデータを取得
      const { data: allData, error: allDataError } = await serviceClient
        .from("users")
        .select("*")
        .in("id", [userRecord1.id, userRecord2.id]);

      expect(allDataError).toBeNull();
      expect(allData).toBeDefined();
      if (allData) {
        expect(allData).toHaveLength(2);
        const ids = allData.map((record) => record.id);
        expect(ids).toContain(userRecord1.id);
        expect(ids).toContain(userRecord2.id);
      }
    });
  });

  describe("RLSポリシーの動作確認", () => {
    it("未認証ユーザーはデータを読み取れない", async () => {
      // テストユーザーとレコードを作成
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      const { user } = await multiClientManager.createAndSignInUser(
        testId,
        email,
        password,
      );

      const serviceClient = multiClientManager.getServiceClient();
      const userRecord = {
        id: `user_${testId}`,
        user_id: user.id,
      };

      await serviceClient.from("users").insert(userRecord);

      // 匿名クライアント（未認証）でデータ取得を試行
      const anonClient = await multiClientManager.createAnonUser(user.id);

      const { data: anonData, error: anonError } = await anonClient
        .from("users")
        .select("*")
        .eq("id", userRecord.id);

      // 未認証ユーザーはRLSによりデータを取得できない
      expect(anonError).toBeNull();
      expect(anonData).toBeDefined();
      expect(anonData).toHaveLength(0); // RLSにより0件が返される
    });

    it("複数のユーザーが並列でアクセスしても互いのデータは見えない", async () => {
      // 複数のテストユーザーを並列で作成
      const testIds = [generateTestId(), generateTestId(), generateTestId()];
      const emails = testIds.map((id) => `test-${id}@example.com`);
      const password = "testpassword123";

      // 並列でユーザーを作成
      const users = await Promise.all(
        emails.map((email, index) =>
          multiClientManager.createAndSignInUser(
            testIds[index],
            email,
            password,
          ),
        ),
      );

      // サービスロールクライアントで全ユーザーのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();
      const userRecords = users.map((user, index) => ({
        id: `user_${testIds[index]}`,
        user_id: user.user.id,
      }));

      await serviceClient.from("users").insert(userRecords);

      // 各ユーザーが並列でサインインして自分のデータのみ取得できることを確認
      const authPromises = users.map(async (user, index) => {
        const authenticatedClient = user.client;

        const { data, error } = await authenticatedClient
          .from("users")
          .select("*");

        expect(error).toBeNull();
        expect(data).toBeDefined();
        if (data) {
          expect(data).toHaveLength(1);
          expect(data[0].user_id).toBe(user.user.id);
          expect(data[0].id).toBe(userRecords[index].id);
        }
      });

      // 全ての並列処理が完了することを確認
      await Promise.all(authPromises);
    });
  });
});
