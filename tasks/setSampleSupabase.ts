import "./utils/envConfig";
import { createClient } from "@supabase/supabase-js";
import { SEX_CODES } from "@/constants/sexCode";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// データベースリセット
console.log("Resetting database...");

// 既存の予約データを削除
const { error: bookingsError } = await supabaseClient
  .from("bookings")
  .delete()
  .gt("id", 0);
if (bookingsError) {
  console.error("Error deleting bookings:", bookingsError);
  throw bookingsError;
}

// 既存のプロフィールデータを削除
const { error: profilesError } = await supabaseClient
  .from("profiles")
  .delete()
  .gt("id", 0);
if (profilesError) {
  console.error("Error deleting profiles:", profilesError);
  throw profilesError;
}

// 既存のサービスデータを削除
const { error: servicesError } = await supabaseClient
  .from("services")
  .delete()
  .gt("id", 0);
if (servicesError) {
  console.error("Error deleting services:", servicesError);
  throw servicesError;
}

// 既存のテストユーザーを削除
const { data: existingUsers, error: listError } =
  await supabaseClient.auth.admin.listUsers();
if (listError) {
  console.error("Error listing users:", listError);
  throw listError;
}

for (const user of existingUsers.users) {
  if (
    user.email === "new@example.com" ||
    user.email === "user@example.com" ||
    user.email === "admin@example.com"
  ) {
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(
      user.id,
    );
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }
  }
}

console.log("Database reset completed. Inserting sample data...");

// サンプルサービスデータを挿入
const { data: insertedServices, error: insertServicesError } =
  await supabaseClient
    .from("services")
    .insert([
      { name: "カット", duration: 60, price: 3000 },
      { name: "カラー", duration: 120, price: 8000 },
      { name: "パーマ", duration: 150, price: 12000 },
      { name: "トリートメント", duration: 45, price: 2500 },
      { name: "カット+カラー", duration: 180, price: 10000 },
      { name: "カット+パーマ", duration: 210, price: 14000 },
    ])
    .select("id, name, duration, price");
if (insertServicesError || !insertedServices) {
  console.error("Error inserting services:", insertServicesError);
  throw insertServicesError;
}

// サービスIDをマッピング
const serviceMap = insertedServices.reduce(
  (map, service) => {
    map[service.name] = service;
    return map;
  },
  {} as Record<string, (typeof insertedServices)[0]>,
);

// 管理者ユーザー
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "admin@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }

  const resProfile = await supabaseClient.from("profiles").insert({
    name: "管理者",
    name_hiragana: "かんりしゃ",
    sex: SEX_CODES.NOT_KNOWN,
    date_of_birth: "1991-12-31",
    user_id: user.data.user.id,
    role: "admin",
  });
  if (resProfile.error) {
    console.error(resProfile);
    throw resProfile.error;
  }
}

// user 登録だけのユーザー
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "new@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }
}

// プロフィール登録をしたユーザー
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "user@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }

  const resProfile = await supabaseClient
    .from("profiles")
    .insert({
      name: "テスト太郎",
      name_hiragana: "てすとたろう",
      sex: SEX_CODES.MALE,
      date_of_birth: "1990-01-01",
      user_id: user.data.user.id,
    })
    .select()
    .single();
  if (resProfile.error) {
    console.error(resProfile);
    throw resProfile.error;
  }

  const day = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const resBookings = await supabaseClient.from("bookings").insert([
    {
      profile_id: resProfile.data.id,
      service_id: serviceMap.カット.id,
      service_name: "カット",
      service_info: {
        name: serviceMap.カット.name,
        duration: serviceMap.カット.duration,
        price: serviceMap.カット.price,
        description: "ヘアカットサービス",
      },
      notes: "初めてです",
      start_time: "2025-05-01T07:00:00Z",
      end_time: "2025-05-01T08:00:00Z",
    },
    {
      profile_id: resProfile.data.id,
      service_id: serviceMap.パーマ.id,
      service_name: "パーマ",
      service_info: {
        name: serviceMap.パーマ.name,
        duration: serviceMap.パーマ.duration,
        price: serviceMap.パーマ.price,
        description: "パーマスタイリングサービス",
      },
      notes: "",
      start_time: `${day}T00:30:00Z`,
      end_time: `${day}T03:00:00Z`,
    },
  ]);
  if (resBookings.error) {
    console.error(resBookings);
    throw resBookings.error;
  }
}

console.log("Sample data insertion completed successfully!");
