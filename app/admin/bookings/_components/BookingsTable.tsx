"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateStringYMDHM } from "@/lib/formatDateStringYMDHM";
import { formatDateStringYMDW } from "@/lib/formatDateStringYMDW";
import { formatTime } from "@/lib/formatTime";
import type {
  AdminBooking,
  BookingSortDirection,
  BookingSortKey,
} from "../../_actions/getAllBookingsAction";

interface BookingsTableProps {
  bookings: AdminBooking[];
  currentSortKey: BookingSortKey;
  currentSortDirection: BookingSortDirection;
}

export function BookingsTable({
  bookings,
  currentSortKey,
  currentSortDirection,
}: BookingsTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createSortUrl = (key: BookingSortKey) => {
    const params = new URLSearchParams(searchParams.toString());

    if (currentSortKey === key) {
      // 同じカラムの場合、ソート方向を反転
      params.set(
        "sortDirection",
        currentSortDirection === "asc" ? "desc" : "asc",
      );
    } else {
      // 違うカラムの場合、新しいキーで昇順ソート
      params.set("sortKey", key);
      params.set("sortDirection", "asc");
    }

    return `${pathname}?${params.toString()}`;
  };

  const SortableHeader = ({
    sortKey: key,
    children,
  }: {
    sortKey: BookingSortKey;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Link href={createSortUrl(key)}>
        <Button
          variant="ghost"
          className="h-auto justify-start p-0 text-left font-semibold hover:bg-transparent"
        >
          {children}
          {currentSortKey === key && (
            <span className="ml-2">
              {currentSortDirection === "asc" ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </span>
          )}
        </Button>
      </Link>
    </TableHead>
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKey="id">ID</SortableHeader>
            <SortableHeader sortKey="profile_name">予約者</SortableHeader>
            <SortableHeader sortKey="service_name">サービス名</SortableHeader>
            <SortableHeader sortKey="start_time">サービス日</SortableHeader>
            <TableHead>開始</TableHead>
            <TableHead>終了</TableHead>
            <SortableHeader sortKey="notes">備考</SortableHeader>
            <SortableHeader sortKey="created_at">登録日時</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow
              key={booking.id}
              className={booking.deleted_at ? "bg-red-50 opacity-75" : ""}
            >
              <TableCell className="font-medium">
                {booking.id}
                {booking.deleted_at && (
                  <span className="ml-2 rounded bg-red-100 px-2 py-1 text-red-800 text-xs">
                    削除済み
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{booking.profile.name}</div>
                  <div className="text-gray-500 text-sm">
                    {booking.profile.name_hiragana}
                  </div>
                </div>
              </TableCell>
              <TableCell>{booking.service_name}</TableCell>
              <TableCell>{formatDateStringYMDW(booking.start_time)}</TableCell>
              <TableCell>{formatTime(booking.start_time)}</TableCell>
              <TableCell>{formatTime(booking.end_time)}</TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={booking.notes}>
                  {booking.notes || "-"}
                </div>
              </TableCell>
              <TableCell>
                {formatDateStringYMDHM(booking.created_at)}
                {booking.deleted_at && (
                  <div className="text-red-600 text-xs">
                    削除: {formatDateStringYMDHM(booking.deleted_at)}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {bookings.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          予約が登録されていません
        </div>
      )}
    </>
  );
}
