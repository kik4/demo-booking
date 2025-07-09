import type { Database } from "@/types/database.types";

export type Service = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "id" | "name" | "price" | "duration"
>;
