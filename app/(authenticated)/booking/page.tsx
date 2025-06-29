"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database.types";
import {
  type CreateBookingFormState,
  createBookingAction,
} from "./_actions/createBookingAction";
import { BookingConfirmation } from "./_components/BookingConfirmation";
import { DateTimeSelection } from "./_components/DateTimeSelection";
import { ServiceSelection } from "./_components/ServiceSelection";

type Step = 1 | 2 | 3;
type Service = Database["public"]["Tables"]["services"]["Row"];

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [state, formAction, pending] = useActionState<
    CreateBookingFormState,
    FormData
  >(createBookingAction, {});

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(ROUTES.ROOT);
          return;
        }

        // Fetch customer profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (profileData) {
          setCustomerName(profileData.name);
        }

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("*")
          .is("deleted_at", null)
          .order("id");

        if (servicesError) {
          console.error("サービス取得エラー:", servicesError);
          toast.error("サービス情報の取得に失敗しました");
        } else {
          setServices(servicesData || []);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const selectedServiceData = services.find(
    (s) => s.id.toString() === selectedService,
  );

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime) return "";

    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
  };

  const endTime =
    selectedTime && selectedServiceData
      ? calculateEndTime(selectedTime, selectedServiceData.duration)
      : "";

  const handleServiceNext = () => {
    if (selectedService) {
      setCurrentStep(2);
    }
  };

  const handleDateTimePrevious = () => {
    setCurrentStep(1);
  };

  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime) {
      setCurrentStep(3);
    }
  };

  const handleConfirmationPrevious = () => {
    setCurrentStep(2);
  };

  const handleBookingConfirm = () => {
    if (!selectedServiceData || !selectedDate || !selectedTime || !endTime) {
      toast.error("必要な情報が不足しています", {
        className: "neumorphism-toast-error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("serviceId", selectedService);
    formData.append("serviceName", selectedServiceData.name);
    formData.append("date", selectedDate);
    formData.append("startTime", selectedTime);
    formData.append("endTime", endTime);
    formData.append("notes", notes);

    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state.errors?._form) {
      state.errors._form.forEach((error) => {
        toast.error(error, {
          className: "neumorphism-toast-error",
        });
      });
    }
  }, [state.errors]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
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

          {state.errors?._form && (
            <div className="neumorphism-input mb-6 rounded-md bg-red-100 p-4">
              <p className="text-red-800 text-sm">{state.errors._form[0]}</p>
            </div>
          )}

          {currentStep === 1 && (
            <ServiceSelection
              selectedService={selectedService}
              notes={notes}
              services={services}
              onServiceChange={setSelectedService}
              onNotesChange={setNotes}
              onNext={handleServiceNext}
              disabled={pending}
            />
          )}

          {currentStep === 2 && selectedServiceData && (
            <DateTimeSelection
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedServiceData.duration}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
              onPrevious={handleDateTimePrevious}
              onNext={handleDateTimeNext}
              disabled={pending}
            />
          )}

          {currentStep === 3 && selectedServiceData && (
            <BookingConfirmation
              bookingData={{
                serviceId: selectedService,
                serviceName: selectedServiceData.name,
                duration: selectedServiceData.duration,
                price: selectedServiceData.price,
                date: selectedDate,
                startTime: selectedTime,
                endTime: endTime,
                notes: notes,
                customerName: customerName,
              }}
              onPrevious={handleConfirmationPrevious}
              onConfirm={handleBookingConfirm}
              disabled={pending}
              isSubmitting={pending}
            />
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href={ROUTES.USER.HOME}
              className={`neumorphism-button-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${pending ? "pointer-events-none opacity-50" : ""}`}
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
