import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import type { Database } from "@/types/database.types";
import { getAvailableTimeSlotsForDate } from "./getAvailableTimeSlotsForDate";
import { getIsAvailableTimeSlot } from "./getIsAvailableTimeSlot";

const bookingValidationSchema = v.object({
  serviceId: v.pipe(
    v.number("有効な値を入力してください"),
    v.minValue(0, "サービスIDは有効な値を入力してください"),
  ),
  notes: v.pipe(v.string("有効な値を入力してください"), v.trim()),
  date: v.pipe(
    v.string("有効な値を入力してください"),
    v.isoDate("予約日を選択してください"),
  ),
  startTime: v.pipe(
    v.string("有効な値を入力してください"),
    v.isoTime("予約開始時間を選択してください"),
  ),
});

export const createBooking = async (
  profile: { id: number },
  params: {
    serviceId: number;
    notes: string;
    date: string;
    startTime: string;
  },
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(bookingValidationSchema, params);

  // サービス情報の取得
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("*")
    .eq("id", parsed.serviceId)
    .is("deleted_at", null)
    .single();
  if (serviceError || !service) {
    throw serviceError || new Error("サービスが見つかりません");
  }

  // 時間計算
  const startDateTime = new Date(`${parsed.date}T${parsed.startTime}:00+09:00`);
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(
    endDateTime.getMinutes() +
      service.duration +
      new Date().getTimezoneOffset() +
      9 * 60,
  );
  const endTime = `${endDateTime.getHours().toString().padStart(2, "0")}:${endDateTime.getMinutes().toString().padStart(2, "0")}`;

  // 可用性チェック
  const { availableSlots } = await getAvailableTimeSlotsForDate(
    params.date,
    supabase,
  );
  if (
    !getIsAvailableTimeSlot(
      { start_time: params.startTime, end_time: endTime },
      availableSlots,
    )
  ) {
    console.error({
      date: params.date,
      start_time: params.startTime,
      end_time: endTime,
      availableSlots,
    });
    throw new Error("指定された時間帯は利用できません");
  }

  // 予約作成
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      profile_id: profile.id,
      service_id: service.id,
      service_name: service.name,
      service_info: {
        name: service.name,
        duration: service.duration,
        price: service.price,
        created_at: service.created_at,
      },
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: params.notes,
    })
    .select()
    .single();
  if (error || !data) {
    throw error || new Error("予約の作成に失敗しました");
  }
  return data;
};
