"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/app/_components/LoadingSpinner";
import { ROUTES } from "@/lib/routes";
import { createBookingAction } from "./_actions/createBookingAction";
import { BookingConfirmation } from "./_components/BookingConfirmation";
import { DateTimeSelection } from "./_components/DateTimeSelection";
import { ServiceSelection } from "./_components/ServiceSelection";
import { useBookingData } from "./_hooks/useBookingData";
import {
  type BookingFormData,
  bookingFormSchema,
} from "./_lib/bookingFormSchema";
import { calculateEndTime, getValidationFieldsForStep } from "./_lib/timeUtils";

type Step = 1 | 2 | 3;

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const router = useRouter();

  const { services, customerName, loading } = useBookingData();

  const form = useForm<BookingFormData>({
    resolver: valibotResolver(bookingFormSchema),
    defaultValues: {
      serviceId: "",
      serviceName: "",
      servicePrice: "",
      serviceDuration: "",
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  const selectedServiceId = form.watch("serviceId");
  const selectedServiceData = services.find(
    (s) => s.id.toString() === selectedServiceId,
  );

  // Watch form values for calculations
  const startTime = form.watch("startTime");

  const serviceDuration = form.watch("serviceDuration");
  const endTime =
    startTime && serviceDuration
      ? calculateEndTime(startTime, Number.parseInt(serviceDuration, 10))
      : "";

  // Update endTime in form when it changes
  useEffect(() => {
    if (endTime) {
      form.setValue("endTime", endTime);
    }
  }, [endTime, form]);

  const handleServiceNext = async () => {
    const fields = getValidationFieldsForStep(1);
    const isValid = await form.trigger(fields);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleDateTimePrevious = () => {
    setCurrentStep(1);
  };

  const handleDateTimeNext = async () => {
    const fields = getValidationFieldsForStep(2);
    const isValid = await form.trigger(fields);
    if (isValid) {
      setCurrentStep(3);
    }
  };

  const handleConfirmationPrevious = () => {
    setCurrentStep(2);
  };

  const handleBookingConfirm = form.handleSubmit(async (data) => {
    if (!selectedServiceData) {
      toast.error("サービス情報が不足しています", {
        className: "neumorphism-toast-error",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("serviceId", data.serviceId);
      formData.append("serviceName", data.serviceName);
      formData.append("servicePrice", data.servicePrice);
      formData.append("serviceDuration", data.serviceDuration);
      formData.append("date", data.date);
      formData.append("startTime", data.startTime);
      formData.append("endTime", data.endTime);
      formData.append("notes", data.notes);

      const result = await createBookingAction(formData);

      if (result.success) {
        toast.success("予約を完了しました", {
          className: "neumorphism-toast-success",
        });
        router.push(ROUTES.USER.HOME);
        return;
      }

      if (result.errors?.root) {
        result.errors.root.forEach((error) => {
          toast.error(error, {
            className: "neumorphism-toast-error",
          });
        });
      }
    } catch {
      toast.error("予期しないエラーが発生しました", {
        className: "neumorphism-toast-error",
      });
    }
  });

  // Set service data when service is selected
  useEffect(() => {
    if (selectedServiceData) {
      form.setValue("serviceName", selectedServiceData.name);
      form.setValue("servicePrice", selectedServiceData.price.toString());
      form.setValue("serviceDuration", selectedServiceData.duration.toString());
    }
  }, [selectedServiceData, form]);

  const { isSubmitting, isSubmitSuccessful } = form.formState;
  const disabled = isSubmitting || isSubmitSuccessful;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
                currentStep >= step
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`h-1 w-16 ${
                  currentStep > step ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-gray-600 text-sm">
          {currentStep === 1 && "サービス選択"}
          {currentStep === 2 && "日時選択"}
          {currentStep === 3 && "予約内容確認"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl">
        <div className="neumorphism-card p-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-bold text-3xl text-gray-900">
              新規予約登録
            </h1>
            <p className="text-gray-600">
              ご希望の内容を入力して予約を作成してください
            </p>
          </div>

          {renderStepIndicator()}

          {Object.keys(form.formState.errors).length > 0 && (
            <div className="neumorphism-input mb-6 rounded-md bg-red-100 p-4">
              {Object.entries(form.formState.errors).map(([key, error]) => (
                <p key={key} className="text-red-800 text-sm">
                  {error?.message}
                </p>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <ServiceSelection
              selectedService={form.watch("serviceId")}
              notes={form.watch("notes")}
              services={services}
              onServiceChange={(value) => form.setValue("serviceId", value)}
              onNotesChange={(value) => form.setValue("notes", value)}
              onNext={handleServiceNext}
              disabled={disabled}
            />
          )}

          {currentStep === 2 && serviceDuration && (
            <DateTimeSelection
              selectedDate={form.watch("date")}
              selectedTime={form.watch("startTime")}
              serviceDuration={Number.parseInt(serviceDuration, 10)}
              onDateChange={(value) => form.setValue("date", value)}
              onTimeChange={(value) => form.setValue("startTime", value)}
              onPrevious={handleDateTimePrevious}
              onNext={handleDateTimeNext}
              disabled={disabled}
            />
          )}

          {currentStep === 3 && selectedServiceData && (
            <BookingConfirmation
              bookingData={{
                serviceId: form.watch("serviceId"),
                serviceName: selectedServiceData.name,
                duration: Number.parseInt(form.watch("serviceDuration"), 10),
                price: Number.parseInt(form.watch("servicePrice"), 10),
                date: form.watch("date"),
                startTime: form.watch("startTime"),
                endTime: form.watch("endTime"),
                notes: form.watch("notes"),
                customerName: customerName,
              }}
              onPrevious={handleConfirmationPrevious}
              onConfirm={handleBookingConfirm}
              disabled={disabled}
              isSubmitting={isSubmitting}
            />
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href={ROUTES.USER.HOME}
              className={`neumorphism-button-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${disabled ? "pointer-events-none opacity-50" : ""}`}
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
