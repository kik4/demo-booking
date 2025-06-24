import { afterEach, describe, expect, it } from "vitest";
import { normalizeDateTime } from "@/lib/normalizeDateTime";
import {
  cleanupTestData,
  generateTestId,
  multiClientManager,
} from "../lib/supabaseTestClient";

describe("Profiles RLS (Row Level Security)", () => {
  afterEach(async () => {
    // テストデータをクリーンアップ
    await cleanupTestData();
    await multiClientManager.cleanup();
  });

  describe("プロフィールの作成と読み取り", () => {
    it("認証されたユーザーが自分のデータを作成できる", async () => {
      // テストユーザーを作成
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      // ユーザーでサインイン
      const { client: authenticatedClient, user } =
        await multiClientManager.createAndSignInUser(testId, email, password);

      // profilesテーブルにレコードを作成
      const profileRecord = {
        name: `profile_${testId}`,
        user_id: user.id,
      };

      const { data, error } = await authenticatedClient
        .from("profiles")
        .insert(profileRecord)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data) {
        expect(data.name).toBe(profileRecord.name);
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

      // サービスロールクライアントで両方のプロフィールのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const profileRecord1 = {
        name: `profile_${testId1}`,
        user_id: user1.id,
      };
      const profileRecord2 = {
        name: `profile_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient
        .from("profiles")
        .insert([profileRecord1, profileRecord2]);

      // user1でサインインして自分のデータのみ取得できることを確認
      const { data: profile1Data, error: profile1Error } =
        await authenticatedClient1.from("profiles").select("*");

      expect(profile1Error).toBeNull();
      expect(profile1Data).toBeDefined();
      if (profile1Data) {
        expect(profile1Data).toHaveLength(1);
        expect(profile1Data[0].name).toBe(profileRecord1.name);
        expect(profile1Data[0].user_id).toBe(user1.id);
      }

      // user2でサインインして自分のデータのみ取得できることを確認
      const { data: profile2Data, error: profile2Error } =
        await authenticatedClient2.from("profiles").select("*");

      expect(profile2Error).toBeNull();
      expect(profile2Data).toBeDefined();
      if (profile2Data) {
        expect(profile2Data).toHaveLength(1);
        expect(profile2Data[0].name).toBe(profileRecord2.name);
        expect(profile2Data[0].user_id).toBe(user2.id);
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

      const profileRecord1 = {
        name: `profile_${testId1}`,
        user_id: user1.id,
      };
      const profileRecord2 = {
        name: `profile_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient
        .from("profiles")
        .insert([profileRecord1, profileRecord2]);

      // user2のuser_idで検索しても取得できないことを確認
      const { data: userIdAccessData, error: userIdAccessError } =
        await authenticatedClient1
          .from("profiles")
          .select("*")
          .eq("user_id", user2.id);

      expect(userIdAccessError).toBeNull();
      expect(userIdAccessData).toBeDefined();
      expect(userIdAccessData).toHaveLength(0); // RLSにより0件が返される

      // 検索しても自分のものしか取得できないことを確認
      const { data: directAccessData, error: directAccessError } =
        await authenticatedClient2.from("profiles").select("*");

      expect(directAccessError).toBeNull();
      expect(directAccessData).toBeDefined();
      expect(directAccessData).toHaveLength(1); // RLSにより1件だけが返される
      if (directAccessData) {
        expect(directAccessData[0].user_id).toEqual(user2.id);
      }
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

      const profileRecord1 = {
        name: `profile_${testId1}`,
        user_id: user1.id,
      };
      const profileRecord2 = {
        name: `profile_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient
        .from("profiles")
        .insert([profileRecord1, profileRecord2]);

      // サービスロールクライアントで全てのテストデータを取得
      const { data: allData, error: allDataError } = await serviceClient
        .from("profiles")
        .select("*")
        .in("user_id", [profileRecord1.user_id, profileRecord2.user_id]);

      expect(allDataError).toBeNull();
      expect(allData).toBeDefined();
      if (allData) {
        expect(allData).toHaveLength(2);
        const ids = allData.map((record) => record.user_id);
        expect(ids).toContain(profileRecord1.user_id);
        expect(ids).toContain(profileRecord2.user_id);
      }
    });

    it("認証されたユーザーが自分のデータのみを更新できる", async () => {
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

      // サービスロールクライアントで両方のプロフィールのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const profileRecord1 = {
        name: `profile_${testId1}`,
        user_id: user1.id,
      };
      const profileRecord2 = {
        name: `profile_${testId2}`,
        user_id: user2.id,
      };

      await serviceClient
        .from("profiles")
        .insert([profileRecord1, profileRecord2]);

      // user1でサインインして自分のデータが更新できることを確認
      const { count: count1, error: error1 } = await authenticatedClient1
        .from("profiles")
        .update({ name: "テスト一郎" }, { count: "exact" })
        .eq("user_id", profileRecord1.user_id);

      expect(error1).toBeNull();
      expect(count1).toEqual(1);

      // user2でサインインしてuser1のデータを更新できないことを確認
      const { count: count2, error: error2 } = await authenticatedClient2
        .from("profiles")
        .update({ name: "テスト次郎" }, { count: "exact" })
        .eq("user_id", profileRecord1.user_id);

      expect(error2).toBeNull();
      expect(count2).toEqual(0);

      // データを読み込んでチェック
      const res = await authenticatedClient1
        .from("profiles")
        .select("user_id, name")
        .single();
      expect(res.data).toBeDefined();
      if (res.data) {
        expect(res.data.user_id).toEqual(user1.id);
        expect(res.data.name).toEqual("テスト一郎");
      }
    });
  });

  describe("削除されたプロフィールの作成と読み取り", () => {
    it("認証されたユーザーでも削除された自分のデータは読み取れない", async () => {
      // テストユーザーを作成
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      const { client: authenticatedClient, user } =
        await multiClientManager.createAndSignInUser(testId, email, password);

      // サービスロールクライアントでプロフィールのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const profileRecord = {
        name: `profile_${testId}`,
        user_id: user.id,
        deleted_at: new Date().toISOString(),
      };

      await serviceClient.from("profiles").insert(profileRecord);

      // テストユーザーでサインインして自分のデータが取得できないことを確認
      const { data: profileData, error: profileError } =
        await authenticatedClient.from("profiles").select("*");

      expect(profileError).toBeNull();
      expect(profileData).toBeDefined();
      expect(profileData).toHaveLength(0);
    });

    it("認証されたユーザーでも削除された自分のデータは更新できない", async () => {
      // テストユーザーを作成
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      const { client: authenticatedClient, user } =
        await multiClientManager.createAndSignInUser(testId, email, password);

      // サービスロールクライアントでプロフィールのレコードを作成
      const serviceClient = multiClientManager.getServiceClient();

      const profileRecord = {
        name: `profile_${testId}`,
        user_id: user.id,
        deleted_at: new Date("2000-01-01T09:00:00Z").toISOString(),
      };

      await serviceClient.from("profiles").insert(profileRecord);

      // テストユーザーでサインインして自分のデータが更新できないことを確認
      const { count, error } = await authenticatedClient
        .from("profiles")
        .update({ name: "テスト一郎" }, { count: "exact" })
        .eq("user_id", profileRecord.user_id);

      expect(error).toBeNull();
      expect(count).toEqual(0);

      // 更新されていないことのチェック
      const { data: profileData, error: profileError } = await serviceClient
        .from("profiles")
        .select("user_id, name, deleted_at");
      expect(profileError).toBeNull();
      expect(profileData).toBeDefined();
      expect(profileData).toHaveLength(1);
      if (profileData) {
        expect(profileData[0].user_id).toEqual(profileRecord.user_id);
        expect(profileData[0].name).toEqual(profileRecord.name);
        expect(profileData[0].deleted_at).toBeDefined();
        expect(normalizeDateTime(profileData[0].deleted_at || "")).toEqual(
          profileRecord.deleted_at,
        );
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
      const profileRecord = {
        name: `profile_${testId}`,
        user_id: user.id,
      };

      await serviceClient.from("profiles").insert(profileRecord);

      // 匿名クライアント（未認証）でデータ取得を試行
      const anonClient = await multiClientManager.createAnonUser();

      const { data: anonData, error: anonError } = await anonClient
        .from("profiles")
        .select("*")
        .eq("user_id", profileRecord.user_id);

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
      const profileRecords = users.map((user, index) => ({
        name: `profile_${testIds[index]}`,
        user_id: user.user.id,
      }));

      await serviceClient.from("profiles").insert(profileRecords);

      // 各ユーザーが並列でサインインして自分のデータのみ取得できることを確認
      const authPromises = users.map(async (user, index) => {
        const authenticatedClient = user.client;

        const { data, error } = await authenticatedClient
          .from("profiles")
          .select("*");

        expect(error).toBeNull();
        expect(data).toBeDefined();
        if (data) {
          expect(data).toHaveLength(1);
          expect(data[0].user_id).toBe(user.user.id);
          expect(data[0].name).toBe(profileRecords[index].name);
        }
      });

      // 全ての並列処理が完了することを確認
      await Promise.all(authPromises);
    });
  });
});
