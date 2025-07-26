import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { safeLog } from "@/lib/sanitize";
import type { Database } from "@/types/database.types";

const deleteBookingValidationSchema = v.object({
  bookingId: v.pipe(v.number(), v.minValue(1)),
});

export const deleteBooking = async (
  profile: { id: number; role: string },
  params: v.InferOutput<typeof deleteBookingValidationSchema>,
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(deleteBookingValidationSchema, params);

  // 予約の存在確認と所有権チェック
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, profile_id, deleted_at")
    .eq("id", parsed.bookingId)
    .single();

  if (fetchError || !booking) {
    throw fetchError || new Error("予約が見つかりません");
  }

  // 既に削除されている場合はエラー
  if (booking.deleted_at) {
    throw new Error("この予約は既に削除されています");
  }

  // 所有権チェック（自分の予約または管理者のみ削除可能）
  const isOwner = booking.profile_id === profile.id;
  const isAdmin = profile.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("この予約を削除する権限がありません");
  }

  // 論理削除（deleted_at と deleted_by_profile_id を設定）
  const { data, error } = await supabase
    .from("bookings")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_profile_id: profile.id,
    })
    .eq("id", parsed.bookingId)
    .select()
    .single();

  if (error || !data) {
    safeLog.error("Booking deletion failed:", error);
    throw error || new Error("予約の削除に失敗しました");
  }

  return data;
};
