import type { SupabaseClient } from "@supabase/supabase-js";
import { differenceInMinutes } from "date-fns";
import { isEqual } from "lodash-es";
import * as v from "valibot";
import { safeLog } from "@/lib/sanitize";
import type { Database } from "@/types/database.types";
import { getAvailableTimeSlotsForDate } from "./getAvailableTimeSlotsForDate";
import { getIsAvailableTimeSlot } from "./getIsAvailableTimeSlot";

const bookingValidationSchema = v.object({
  serviceId: v.pipe(v.number(), v.minValue(0)),
  serviceName: v.pipe(v.string(), v.trim(), v.minLength(1)),
  servicePrice: v.pipe(v.number(), v.minValue(1)),
  serviceDuration: v.pipe(v.number(), v.minValue(1)),
  date: v.pipe(v.string(), v.isoDate()),
  startTime: v.pipe(v.string(), v.isoTime()),
  endTime: v.pipe(v.string(), v.isoTime()),
  notes: v.pipe(v.string(), v.trim(), v.maxLength(500)),
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
    .select("id, name, price, duration")
    .eq("id", parsed.serviceId)
    .is("deleted_at", null)
    .single();
  if (serviceError || !service) {
    throw serviceError || new Error("サービスが見つかりません");
  }

  // 入力データとサービス情報が一致しているかチェック
  const inputService = {
    id: parsed.serviceId,
    name: parsed.serviceName,
    price: parsed.servicePrice,
    duration: parsed.serviceDuration,
  };
  if (!isEqual(service, inputService)) {
    throw new Error("サービス情報が一致しません");
  }

  // サービス時間が一致しているかチェック
  if (
    differenceInMinutes(
      new Date(`1970-01-01T${parsed.endTime}:00Z`),
      new Date(`1970-01-01T${parsed.startTime}:00Z`),
    ) !== parsed.serviceDuration
  ) {
    throw new Error("サービス時間が一致しません");
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
    safeLog.error("Time slot not available:", {
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
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        duration: parsed.serviceDuration,
        price: parsed.servicePrice,
      },
      notes: params.notes,
    })
    .select()
    .single();
  if (error || !data) {
    safeLog.error("Booking creation failed:", error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};
