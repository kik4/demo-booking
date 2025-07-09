import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import type { Database } from "@/types/database.types";
import { getAvailableTimeSlotsForDate } from "./getAvailableTimeSlotsForDate";
import { getIsAvailableTimeSlot } from "./getIsAvailableTimeSlot";

const bookingValidationSchema = v.object({
  serviceId: v.pipe(v.number()),
  serviceName: v.pipe(v.string(), v.trim(), v.minLength(1)),
  date: v.pipe(v.string(), v.isoDate()),
  startTime: v.pipe(v.string(), v.isoTime()),
  endTime: v.pipe(v.string(), v.isoTime()),
  notes: v.pipe(v.string(), v.trim(), v.maxLength(2000)),
});

export const createBooking = async (
  profile: { id: number },
  params: v.InferOutput<typeof bookingValidationSchema>,
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

  // 可用性チェック
  const { availableSlots } = await getAvailableTimeSlotsForDate(
    parsed.date,
    supabase,
  );
  if (
    !getIsAvailableTimeSlot(
      { start_time: parsed.startTime, end_time: parsed.endTime },
      availableSlots,
    )
  ) {
    console.error({
      date: parsed.date,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
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
      service_name: parsed.serviceName,
      start_time: new Date(
        `${parsed.date}T${parsed.startTime}+09:00`,
      ).toISOString(),
      end_time: new Date(
        `${parsed.date}T${parsed.endTime}+09:00`,
      ).toISOString(),
      service_info: {
        name: service.name,
        duration: service.duration,
        price: service.price,
        created_at: service.created_at,
      },
      notes: params.notes,
    })
    .select()
    .single();
  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};
