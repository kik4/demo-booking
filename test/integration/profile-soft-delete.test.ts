import { afterEach, describe, expect, it } from "vitest";
import { SEX_CODES } from "@/lib/constants";
import { normalizeDateTime } from "@/lib/normalizeDateTime";
import {
  cleanupTestData,
  generateTestId,
  multiClientManager,
} from "../lib/supabaseTestClient";

describe("Profile Soft Delete", () => {
  afterEach(async () => {
    await cleanupTestData();
    await multiClientManager.cleanup();
  });

  describe("ソフトデリート機能", () => {
    it("deleted_atを設定してソフトデリートできる", async () => {
      const testId = generateTestId();
      const email = `test-${testId}@example.com`;
      const password = "testpassword123";

      // ユーザーでサインイン
      const { client: authenticatedClient, user } =
        await multiClientManager.createAndSignInUser(testId, email, password);

      // プロフィールを作成
      const profileRecord = {
        name: `profile_${testId}`,
        name_hiragana: `ぷろふぃーる${testId}`,
        sex: SEX_CODES.MALE,
        date_of_birth: "1990-01-01",
        created_at: normalizeDateTime(new Date().toISOString()),
        updated_at: normalizeDateTime(new Date().toISOString()),
      };

      const { data: createdProfile, error: createError } =
        await authenticatedClient
          .from("profiles")
          .insert(profileRecord)
          .select()
          .single();

      expect(createError).toBeNull();
      expect(createdProfile).toBeDefined();

      // プロフィールが正常に取得できることを確認
      const { data: beforeDelete, error: beforeDeleteError } =
        await authenticatedClient
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

      expect(beforeDeleteError).toBeNull();
      expect(beforeDelete).toBeDefined();
      expect(beforeDelete?.deleted_at).toBeNull();

      // ソフトデリートを実行 (サービスロールクライアントでdeleted_atに現在時刻を設定)
      const serviceRoleClient = multiClientManager.getServiceClient();
      const { error: softDeleteError } = await serviceRoleClient
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      expect(softDeleteError).toBeNull();

      // ソフトデリート後、プロフィールが取得できないことを確認（RLSによる制限）
      const { data: afterDelete, error: afterDeleteError } =
        await authenticatedClient
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

      // RLSポリシーにより、deleted_at IS NULLでないレコードは取得できない
      expect(afterDelete).toBeNull();
      expect(afterDeleteError).toBeDefined();

      // サービスロールクライアントでは削除されたレコードも取得できることを確認
      const { data: serviceRoleData, error: serviceRoleError } =
        await serviceRoleClient
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

      expect(serviceRoleError).toBeNull();
      expect(serviceRoleData).toBeDefined();
      expect(serviceRoleData?.deleted_at).not.toBeNull();
    });
  });

  describe("ソフトデリートされたプロフィールのアクセス制御", () => {
    it("削除されたプロフィールは他のユーザーからも見えない", async () => {
      const testId1 = generateTestId();
      const testId2 = generateTestId();
      const email1 = `test-${testId1}@example.com`;
      const email2 = `test-${testId2}@example.com`;
      const password = "testpassword123";

      // 2人のユーザーを作成
      const { client: client1, user: user1 } =
        await multiClientManager.createAndSignInUser(testId1, email1, password);
      const { client: client2, user: user2 } =
        await multiClientManager.createAndSignInUser(testId2, email2, password);

      // 両方のユーザーでプロフィールを作成
      const profileRecord1 = {
        name: `profile_${testId1}`,
        name_hiragana: `ぷろふぃーる${testId1}`,
        sex: SEX_CODES.MALE,
        date_of_birth: "1990-01-01",
        created_at: normalizeDateTime(new Date().toISOString()),
        updated_at: normalizeDateTime(new Date().toISOString()),
      };

      const profileRecord2 = {
        name: `profile_${testId2}`,
        name_hiragana: `ぷろふぃーる${testId2}`,
        sex: SEX_CODES.FEMALE,
        date_of_birth: "1990-01-01",
        created_at: normalizeDateTime(new Date().toISOString()),
        updated_at: normalizeDateTime(new Date().toISOString()),
      };

      await client1.from("profiles").insert(profileRecord1);
      await client2.from("profiles").insert(profileRecord2);

      // user1のプロフィールをソフトデリート (サービスロールクライアントで実行)
      const serviceClient = multiClientManager.getServiceClient();
      await serviceClient
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", user1.id);

      // user2から削除されたuser1のプロフィールは見えないことを確認
      const { data: invisibleProfile, error } = await client2
        .from("profiles")
        .select("*")
        .eq("user_id", user1.id)
        .single();

      expect(invisibleProfile).toBeNull();
      expect(error).toBeDefined();

      // user2は自分のプロフィールは正常に取得できることを確認
      const { data: visibleProfile, error: visibleError } = await client2
        .from("profiles")
        .select("*")
        .eq("user_id", user2.id)
        .single();

      expect(visibleError).toBeNull();
      expect(visibleProfile).toBeDefined();
      expect(visibleProfile?.deleted_at).toBeNull();
    });
  });
});
