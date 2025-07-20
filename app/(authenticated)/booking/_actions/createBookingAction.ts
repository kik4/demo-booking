"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { requireUserAuth } from "@/lib/auth";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { ROUTES } from "@/lib/routes";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";
import { bookingFormSchema } from "../_lib/bookingFormSchema";

interface CreateBookingFormState {
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
    root?: string[];
  };
}

export async function createBookingAction(
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

  const result = v.safeParse(bookingFormSchema, {
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
          root: [result.error],
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
        root: [
          error instanceof Error
            ? error.message
            : "予期しないエラーが発生しました",
        ],
      },
    };
  }

  return { success: true };
}
