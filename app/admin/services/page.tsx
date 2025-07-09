import {
  getServices,
  type SortDirection,
  type SortKey,
} from "../_actions/getServices";
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
        <h1 className="mb-8 font-bold text-3xl text-gray-900">サービス一覧</h1>

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
