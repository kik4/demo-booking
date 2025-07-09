import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateStringYMD } from "@/lib/formatDateStringYMD";
import { formatDateStringYMDHM } from "@/lib/formatDateStringYMDHM";
import { formatTime } from "@/lib/formatTime";
import { getAllBookings } from "../_actions/getAllBookings";

export default async function BookingsPage() {
  const bookings = await getAllBookings();

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">予約一覧</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>予約者</TableHead>
                <TableHead>サービス名</TableHead>
                <TableHead>サービス日</TableHead>
                <TableHead>開始時刻</TableHead>
                <TableHead>終了時刻</TableHead>
                <TableHead>備考</TableHead>
                <TableHead>登録日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.profile.name}</div>
                      <div className="text-gray-500 text-sm">
                        {booking.profile.name_hiragana}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{booking.service_name}</TableCell>
                  <TableCell>
                    {formatDateStringYMD(booking.start_time)}
                  </TableCell>
                  <TableCell>{formatTime(booking.start_time)}</TableCell>
                  <TableCell>{formatTime(booking.end_time)}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={booking.notes}>
                      {booking.notes || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDateStringYMDHM(booking.created_at)}
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
        </div>
      </div>
    </div>
  );
}
