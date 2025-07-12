import * as v from "valibot";

// Unified booking schema - used for both client-side form and server-side validation
export const bookingFormSchema = v.object({
  serviceId: v.pipe(v.string(), v.minLength(1, "サービスを選択してください")),
  serviceName: v.pipe(v.string(), v.minLength(1, "サービス名が必要です")),
  servicePrice: v.pipe(v.string(), v.minLength(1, "サービス価格が必要です")),
  serviceDuration: v.pipe(v.string(), v.minLength(1, "サービス時間が必要です")),
  date: v.pipe(v.string(), v.minLength(1, "予約日を選択してください")),
  startTime: v.pipe(v.string(), v.minLength(1, "予約時間を選択してください")),
  endTime: v.pipe(v.string(), v.minLength(1, "終了時間が必要です")),
  notes: v.pipe(
    v.string(),
    v.maxLength(2000, "補足は2000文字以内で入力してください"),
  ),
});

export type BookingFormData = v.InferInput<typeof bookingFormSchema>;
