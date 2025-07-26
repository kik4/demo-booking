"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { requireUserAuth } from "@/lib/auth";
import { createBooking } from "@/lib/db/bookings/createBooking";
import { BOOKING_RATE_LIMIT, withRateLimit } from "@/lib/rateLimit";
import { ROUTES } from "@/lib/routes";
import { detectSuspiciousInput, safeLog } from "@/lib/sanitize";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";
import { bookingFormSchema } from "../_lib/bookingFormSchema";

interface CreateBookingFormState {
  success?: boolean;
  error?: string;
  rateLimited?: true;
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
  return withRateLimit(BOOKING_RATE_LIMIT, async () => {
    const rawData = {
      serviceId: formData.get("serviceId") as string,
      serviceName: formData.get("serviceName") as string,
      servicePrice: formData.get("servicePrice") as string,
      serviceDuration: formData.get("serviceDuration") as string,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      notes: formData.get("notes") as string,
    };

    // セキュリティ脅威の検出とログ記録
    if (rawData.notes) {
      const suspiciousAnalysis = detectSuspiciousInput(rawData.notes);
      if (suspiciousAnalysis.isSuspicious) {
        safeLog.warn("[SECURITY] Suspicious input detected in booking notes:", {
          patterns: suspiciousAnalysis.patterns,
          sanitizedInput: rawData.notes, // safeLog内部でサニタイゼーション済み
          timestamp: new Date().toISOString(),
        });
      }
    }

    // バリデーション実行（サニタイゼーションはバリデーションスキーマで処理）
    const validationResult = v.safeParse(bookingFormSchema, rawData);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validationResult.issues) {
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
            serviceId: Number.parseInt(validationResult.output.serviceId, 10),
            serviceName: validationResult.output.serviceName,
            servicePrice: Number.parseInt(
              validationResult.output.servicePrice,
              10,
            ),
            serviceDuration: Number.parseInt(
              validationResult.output.serviceDuration,
              10,
            ),
            date: validationResult.output.date,
            startTime: validationResult.output.startTime,
            endTime: validationResult.output.endTime,
            notes: validationResult.output.notes || "",
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
      safeLog.error("Unexpected error:", error);
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
  });
}
