"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AdminService } from "../../_actions/getServices";
import { createServiceAction } from "../_actions/createServiceAction";
import { updateServiceAction } from "../_actions/updateServiceAction";
import { type ServiceFormData, serviceSchema } from "../_schemas/serviceSchema";

type FormValues = ServiceFormData;

interface ServiceFormProps {
  service?: AdminService;
  trigger: React.ReactNode;
}

export function ServiceForm({ service, trigger }: ServiceFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!service;

  const form = useForm<FormValues>({
    resolver: valibotResolver(serviceSchema),
    defaultValues: {
      name: service?.name || "",
      duration: service?.duration || 0,
      price: service?.price || 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("duration", values.duration.toString());
      formData.append("price", values.price.toString());

      let result: { success?: boolean; error?: string; data?: AdminService };
      if (isEditing) {
        result = await updateServiceAction(service.id, formData);
      } else {
        result = await createServiceAction(formData);
      }

      if ("success" in result && result.success) {
        setOpen(false);
        form.reset();
      } else {
        form.setError("root", { message: result.error });
      }
    } catch (_error) {
      form.setError("root", { message: "エラーが発生しました" });
    }
  };

  const { isSubmitting, isSubmitSuccessful } = form.formState;
  const disabled = isSubmitting || isSubmitSuccessful;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "サービス編集" : "新しいサービス作成"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サービス名</FormLabel>
                  <FormControl>
                    <Input placeholder="例：カット" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所要時間（分）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例：60"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>料金（円）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例：3000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-red-600 text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={disabled}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={disabled}>
                {disabled ? "処理中..." : isEditing ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
