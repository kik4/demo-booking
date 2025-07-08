"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import { getIsAvailableTimeSlot } from "@/lib/db/bookings/getIsAvailableTimeSlot";
import { ROUTES } from "@/lib/routes";
import { createClient, createServiceClient } from "@/lib/supabaseClientServer";

export interface ExistingBooking {
  id: number;
  start_time: string;
  end_time: string;
}

const createBookingSchema = v.object({
  serviceId: v.pipe(v.string(), v.minLength(1, "サービスを選択してください")),
  serviceName: v.pipe(v.string(), v.minLength(1, "サービス名が必要です")),
  date: v.pipe(v.string(), v.minLength(1, "予約日を選択してください")),
  startTime: v.pipe(v.string(), v.minLength(1, "予約時間を選択してください")),
  endTime: v.pipe(v.string(), v.minLength(1, "終了時間が必要です")),
  notes: v.string(),
});

export interface CreateBookingFormState {
  success?: boolean;
  errors?: {
    serviceId?: string[];
    serviceName?: string[];
    date?: string[];
    startTime?: string[];
    endTime?: string[];
    notes?: string[];
    _form?: string[];
  };
  formData?: {
    serviceId?: string;
    serviceName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  };
}

export async function createBookingAction(
  _prevState: CreateBookingFormState,
  formData: FormData,
): Promise<CreateBookingFormState> {
  const serviceId = formData.get("serviceId") as string;
  const serviceName = formData.get("serviceName") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const notes = formData.get("notes") as string;

  const result = v.safeParse(createBookingSchema, {
    serviceId,
    serviceName,
    date,
    startTime,
    endTime,
    notes,
  });

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.issues) {
      const path = issue.path
        ? issue.path.map((p) => String(p.key)).join(".")
        : "root";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return {
      errors: errors,
      formData: {
        serviceId,
        serviceName,
        date,
        startTime,
        endTime,
        notes,
      },
    };
  }

  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        errors: {
          _form: ["認証エラーが発生しました"],
        },
        formData: {
          serviceId,
          serviceName,
          date,
          startTime,
          endTime,
          notes,
        },
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile) {
      return {
        errors: {
          _form: ["プロフィール情報が見つかりません"],
        },
        formData: {
          serviceId,
          serviceName,
          date,
          startTime,
          endTime,
          notes,
        },
      };
    }

    // Check for overlapping bookings (system-wide, not just current user)
    const { availableSlots } = await getAvailableTimeSlotsForDate(
      date,
      supabase,
    );
    if (
      !getIsAvailableTimeSlot(
        { start_time: startTime, end_time: endTime },
        availableSlots,
      )
    ) {
      return {
        errors: {
          _form: ["選択した時間は利用できません。他の時間をお選びください。"],
        },
        formData: {
          serviceId,
          serviceName,
          date,
          startTime,
          endTime,
          notes,
        },
      };
    }

    // Get service information for snapshot
    const serviceIdNum = Number.parseInt(serviceId, 10);
    if (Number.isNaN(serviceIdNum)) {
      return {
        errors: {
          _form: ["無効なサービスIDです。"],
        },
      };
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceIdNum)
      .is("deleted_at", null)
      .single();

    if (serviceError || !service) {
      console.error("Service lookup error:", serviceError);
      return {
        errors: {
          _form: ["選択されたサービスが見つかりません。"],
        },
      };
    }

    // Create booking
    const startDateTime = new Date(`${date}T${startTime}:00+09:00`);
    const endDateTime = new Date(`${date}T${endTime}:00+09:00`);

    // Use service client for inserting booking to bypass RLS
    const serviceClient = await createServiceClient();
    const { error: bookingError } = await serviceClient
      .from("bookings")
      .insert({
        profile_id: profile.id,
        service_id: service.id,
        service_name: serviceName,
        service_info: {
          name: service.name,
          duration: service.duration,
          price: service.price,
          created_at: service.created_at,
        },
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: notes || "",
      });

    if (bookingError) {
      console.error("Booking creation error:", bookingError);
      return {
        errors: {
          _form: ["予約の作成に失敗しました。時間をおいて再度お試しください。"],
        },
        formData: {
          serviceId,
          serviceName,
          date,
          startTime,
          endTime,
          notes,
        },
      };
    }

    revalidatePath(ROUTES.USER.HOME);
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        _form: ["予期しないエラーが発生しました"],
      },
      formData: {
        serviceId,
        serviceName,
        date,
        startTime,
        endTime,
        notes,
      },
    };
  }

  redirect(`${ROUTES.USER.HOME}?booking=success`);
}
