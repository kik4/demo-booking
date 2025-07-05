import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";
import type { Database } from "@/types/database.types";

const serviceValidationSchema = v.array(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
    duration: v.pipe(v.number(), v.minValue(1)),
    price: v.pipe(v.number(), v.minValue(100)),
  }),
);

export const createServices = async (
  params: { name: string; duration: number; price: number }[],
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(serviceValidationSchema, params);

  const { data: insertedServices, error: insertServicesError } = await supabase
    .from("services")
    .insert(parsed)
    .select("id, name, duration, price");
  if (insertServicesError || !insertedServices) {
    throw insertServicesError;
  }
  return insertedServices;
};
