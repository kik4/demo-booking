import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ROUTES } from "@/lib/routes";
import { getServicesAction } from "../_actions/getServicesAction";
import { getUserProfileAction } from "../_actions/getUserProfileAction";
import type { Service } from "../_actions/types";

interface UseBookingDataReturn {
  services: Service[];
  customerName: string;
  loading: boolean;
  error: string | null;
}

export function useBookingData(): UseBookingDataReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customer profile
        const profileResult = await getUserProfileAction();
        if ("error" in profileResult) {
          console.error("プロフィール取得エラー:", profileResult.error);
          toast.error(profileResult.error);
          router.push(ROUTES.ROOT);
          return;
        }
        setCustomerName(profileResult.profile.name);

        // Fetch services
        const servicesResult = await getServicesAction();
        if ("error" in servicesResult) {
          console.error("サービス取得エラー:", servicesResult.error);
          toast.error(servicesResult.error);
          setError(servicesResult.error);
        } else {
          setServices(servicesResult.services);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        const errorMessage = "データの取得に失敗しました";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  return {
    services,
    customerName,
    loading,
    error,
  };
}
