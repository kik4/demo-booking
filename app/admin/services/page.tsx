import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getServices,
  type SortDirection,
  type SortKey,
} from "../_actions/getServices";
import { ServiceForm } from "./_components/ServiceForm";
import { ServicesTable } from "./_components/ServicesTable";

interface SearchParams {
  sortKey?: SortKey;
  sortDirection?: SortDirection;
}

interface ServicesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const resolvedSearchParams = await searchParams;
  const sortKey = resolvedSearchParams.sortKey || "id";
  const sortDirection = resolvedSearchParams.sortDirection || "asc";

  const services = await getServices(sortKey, sortDirection);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-bold text-3xl text-gray-900">サービス一覧</h1>
          <ServiceForm
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新しいサービス
              </Button>
            }
          />
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <ServicesTable
            services={services}
            currentSortKey={sortKey}
            currentSortDirection={sortDirection}
          />
        </div>
      </div>
    </div>
  );
}
