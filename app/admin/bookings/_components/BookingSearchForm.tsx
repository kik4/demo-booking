"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

const searchFormSchema = v.object({
  includeDeleted: v.boolean(),
});

type SearchFormValues = v.InferInput<typeof searchFormSchema>;

export function BookingSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SearchFormValues>({
    resolver: valibotResolver(searchFormSchema),
    defaultValues: {
      includeDeleted: searchParams.get("includeDeleted") === "true",
    },
  });

  const onSubmit = (values: SearchFormValues) => {
    const params = new URLSearchParams(searchParams.toString());

    if (values.includeDeleted) {
      params.set("includeDeleted", "true");
    } else {
      params.delete("includeDeleted");
    }

    router.push(`/admin/bookings?${params.toString()}`);
  };

  const onReset = () => {
    form.reset({ includeDeleted: false });
    router.push("/admin/bookings");
  };

  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="includeDeleted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-sm">
                      削除された予約も表示する
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onReset}>
                リセット
              </Button>
              <Button type="submit">適用</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
