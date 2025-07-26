import * as v from "valibot";

// Unified booking schema - used for both client-side form and server-side validation
export const bookingFormSchema = v.object({
  serviceId: v.pipe(v.string(), v.minLength(1, "サービスを選択してください")),
  serviceName: v.pipe(v.string(), v.minLength(1, "サービス名が必要です")),
  servicePrice: v.pipe(v.string(), v.minLength(1, "サービス価格が必要です")),
  serviceDuration: v.pipe(v.string(), v.minLength(1, "サービス時間が必要です")),
  date: v.pipe(
    v.string(),
    v.minLength(1, "予約日を選択してください"),
    v.check((value) => {
      const selectedDate = new Date(`${value}T00:00:00+09:00`);
      const today = new Date();
      const jstToday = new Date(
        today.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }),
      );
      jstToday.setHours(0, 0, 0, 0);
      return selectedDate >= jstToday;
    }, "過去の日付は選択できません"),
    v.check((value) => {
      const selectedDate = new Date(`${value}T00:00:00+09:00`);
      const today = new Date();
      const jstToday = new Date(
        today.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }),
      );
      jstToday.setHours(0, 0, 0, 0);

      // 3か月後の日付を計算
      const threeMonthsLater = new Date(jstToday);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      return selectedDate <= threeMonthsLater;
    }, "3か月以上先の日付は選択できません"),
  ),
  startTime: v.pipe(v.string(), v.minLength(1, "予約時間を選択してください")),
  endTime: v.pipe(v.string(), v.minLength(1, "終了時間が必要です")),
  notes: v.pipe(
    v.string(),
    v.maxLength(500, "補足は500文字以内で入力してください"),
    v.regex(/^[^<>]*$/, "HTMLタグは使用できません"),
  ),
});

export type BookingFormData = v.InferInput<typeof bookingFormSchema>;
