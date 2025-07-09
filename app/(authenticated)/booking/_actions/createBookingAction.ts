"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { requireUserAuth } from "@/lib/auth";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { ROUTES } from "@/lib/routes";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";

export interface ExistingBooking {
  id: number;
  start_time: string;
  end_time: string;
}

const createBookingSchema = v.object({
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

export interface CreateBookingFormState {
  success?: boolean;
  errors?: {
    serviceId?: string[];
    serviceName?: string[];
    servicePrice?: string[];
    serviceDuration?: string[];
    date?: string[];
    startTime?: string[];
    endTime?: string[];
    notes?: string[];
    _form?: string[];
  };
  formData?: {
    serviceId?: string;
    serviceName?: string;
    servicePrice?: string;
    serviceDuration?: string;
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
  const servicePrice = formData.get("servicePrice") as string;
  const serviceDuration = formData.get("serviceDuration") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const notes = formData.get("notes") as string;

  const result = v.safeParse(createBookingSchema, {
    serviceId,
    serviceName,
    servicePrice,
    serviceDuration,
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
        servicePrice,
        serviceDuration,
        date,
        startTime,
        endTime,
        notes,
      },
    };
  }

  try {
    const supabase = await createClient();

    const result = await requireUserAuth(supabase, async (authResult) => {
      // Use service client for creating booking to bypass RLS
      const serviceClient = await createServiceClient();

      await createBooking(
        authResult.profile,
        {
          serviceId: Number.parseInt(serviceId, 10),
          serviceName,
          servicePrice: Number.parseInt(servicePrice, 10),
          serviceDuration: Number.parseInt(serviceDuration, 10),
          date,
          startTime,
          endTime,
          notes: notes || "",
        },
        serviceClient,
      );

      revalidatePath(ROUTES.USER.HOME);
      return { success: true };
    });

    if ("error" in result) {
      return {
        errors: {
          _form: [result.error],
        },
        formData: {
          serviceId,
          serviceName,
          servicePrice,
          serviceDuration,
          date,
          startTime,
          endTime,
          notes,
        },
      };
    }

    if (!result.success) {
      return result;
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "予期しないエラーが発生しました",
        ],
      },
      formData: {
        serviceId,
        serviceName,
        servicePrice,
        serviceDuration,
        date,
        startTime,
        endTime,
        notes,
      },
    };
  }

  redirect(`${ROUTES.USER.HOME}?booking=success`);
}
