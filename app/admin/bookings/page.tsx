import {
  type BookingSortDirection,
  type BookingSortKey,
  getAllBookingsAction,
} from "../_actions/getAllBookingsAction";
import { BookingsTable } from "./_components/BookingsTable";

interface BookingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingsPage({
  searchParams,
}: BookingsPageProps) {
  const params = await searchParams;
  const sortKey = (params.sortKey as BookingSortKey) || "start_time";
  const sortDirection =
    (params.sortDirection as BookingSortDirection) || "desc";

  const bookings = await getAllBookingsAction(sortKey, sortDirection);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">予約一覧</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <BookingsTable
            bookings={bookings}
            currentSortKey={sortKey}
            currentSortDirection={sortDirection}
          />
        </div>
      </div>
    </div>
  );
}
