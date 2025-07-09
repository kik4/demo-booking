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

const singleServiceValidationSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  duration: v.pipe(v.number(), v.minValue(1)),
  price: v.pipe(v.number(), v.minValue(100)),
});

export const createServices = async (
  params: { name: string; duration: number; price: number }[],
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(serviceValidationSchema, params);

  const { data, error } = await supabase
    .from("services")
    .insert(parsed)
    .select("id, name, duration, price");
  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};

export const createService = async (
  params: { name: string; duration: number; price: number },
  supabase: SupabaseClient<Database>,
) => {
  const parsed = v.parse(singleServiceValidationSchema, params);

  const { data, error } = await supabase
    .from("services")
    .insert(parsed)
    .select("id, name, duration, price, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};

export const updateService = async (
  id: number,
  params: { name?: string; duration?: number; price?: number },
  supabase: SupabaseClient<Database>,
) => {
  const updateData: { name?: string; duration?: number; price?: number } = {};

  if (params.name !== undefined) {
    updateData.name = v.parse(
      v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
      params.name,
    );
  }
  if (params.duration !== undefined) {
    updateData.duration = v.parse(
      v.pipe(v.number(), v.minValue(1)),
      params.duration,
    );
  }
  if (params.price !== undefined) {
    updateData.price = v.parse(
      v.pipe(v.number(), v.minValue(100)),
      params.price,
    );
  }

  const { data, error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, name, duration, price, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};

export const deleteService = async (
  id: number,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};

export const getService = async (
  id: number,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration, price, created_at, updated_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    console.error(error);
    throw error || new Error("データが取得できませんでした");
  }
  return data;
};
