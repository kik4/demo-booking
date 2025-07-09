import "./utils/envConfig";
import { createClient } from "@supabase/supabase-js";
import { addDays, nextMonday } from "date-fns";
import { ROLE_CODES } from "@/constants/roleCode";
import { SEX_CODES } from "@/constants/sexCode";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { createProfile } from "@/lib/db/profiles";
import { createServices } from "@/lib/db/services";

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
  const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(
    user.id,
  );
  if (deleteError) {
    console.error("Error deleting user:", deleteError);
    throw deleteError;
  }
}

console.log("Database reset completed. Inserting sample data...");

// サンプルサービスデータを挿入
const sampleServicesData = [
  { name: "カット", duration: 60, price: 3000 },
  { name: "カラー", duration: 120, price: 8000 },
  { name: "パーマ", duration: 150, price: 12000 },
  { name: "トリートメント", duration: 45, price: 2500 },
  { name: "カット+カラー", duration: 180, price: 10000 },
  { name: "カット+パーマ", duration: 210, price: 14000 },
];

const insertedServices = await createServices(
  sampleServicesData,
  supabaseClient,
);
console.log(`Successfully inserted ${insertedServices.length} services`);

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

  await createProfile(
    user.data.user,
    {
      name: "管理者",
      name_hiragana: "かんりしゃ",
      sex: SEX_CODES.NOT_KNOWN,
      date_of_birth: "1991-12-31",
      role: ROLE_CODES.ADMIN,
    },
    supabaseClient,
  );
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

  const resProfile = await createProfile(
    user.data.user,
    {
      name: "テスト太郎",
      name_hiragana: "てすとたろう",
      sex: SEX_CODES.MALE,
      date_of_birth: "1990-01-01",
      role: ROLE_CODES.USER,
    },
    supabaseClient,
  );

  // 予約データを作成
  const day1 = nextMonday(new Date()).toISOString().slice(0, 10);
  const day2 = addDays(day1, 1).toISOString().slice(0, 10);

  // 1つ目の予約: カット
  await createBooking(
    resProfile,
    {
      serviceId: serviceMap.カット.id,
      serviceName: serviceMap.カット.name,
      servicePrice: serviceMap.カット.price,
      serviceDuration: serviceMap.カット.duration,
      date: day1,
      startTime: "10:00",
      endTime: "11:00",
      notes: "初めてです",
    },
    supabaseClient,
  );

  // 2つ目の予約: パーマ
  await createBooking(
    resProfile,
    {
      serviceId: serviceMap.パーマ.id,
      serviceName: serviceMap.パーマ.name,
      servicePrice: serviceMap.パーマ.price,
      serviceDuration: serviceMap.パーマ.duration,
      date: day2,
      startTime: "16:00",
      endTime: "18:30",
      notes: "",
    },
    supabaseClient,
  );
}

// プロフィール登録をしたユーザー2
{
  const user = await supabaseClient.auth.admin.createUser({
    email: "user2@example.com",
    password: "password",
    email_confirm: true,
  });
  if (user.error) {
    console.error(user);
    throw user.error;
  }

  const resProfile = await createProfile(
    user.data.user,
    {
      name: "テスト次郎",
      name_hiragana: "てすとじろう",
      sex: SEX_CODES.MALE,
      date_of_birth: "1998-10-10",
      role: ROLE_CODES.USER,
    },
    supabaseClient,
  );

  // 予約データを作成
  const day1 = nextMonday(new Date()).toISOString().slice(0, 10);

  // 1つ目の予約: カット
  await createBooking(
    resProfile,
    {
      serviceId: serviceMap.カット.id,
      serviceName: serviceMap.カット.name,
      servicePrice: serviceMap.カット.price,
      serviceDuration: serviceMap.カット.duration,
      date: day1,
      startTime: "11:00",
      endTime: "12:00",
      notes: "",
    },
    supabaseClient,
  );
}

console.log("Sample data insertion completed successfully!");
