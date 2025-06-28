import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEX_LABELS } from "@/lib/sexCode";

import { getAllBookings, getUsers } from "./actions";

export default async function AdminPage() {
  const users = await getUsers();
  const bookings = await getAllBookings();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "管理者" : "一般ユーザー";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">
          管理者ダッシュボード
        </h1>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 font-semibold text-xl">予約一覧</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>予約者</TableHead>
                  <TableHead>サービス名</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>終了時刻</TableHead>
                  <TableHead>備考</TableHead>
                  <TableHead>作成日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.profile.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {booking.profile.name_hiragana}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.service_name}</TableCell>
                    <TableCell>{formatDateTime(booking.start_time)}</TableCell>
                    <TableCell>{formatDateTime(booking.end_time)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={booking.notes}>
                        {booking.notes || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(booking.created_at)}</TableCell>
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

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 font-semibold text-xl">ユーザー一覧</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>ふりがな</TableHead>
                  <TableHead>生年月日</TableHead>
                  <TableHead>性別</TableHead>
                  <TableHead>権限</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead>更新日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.name_hiragana}</TableCell>
                    <TableCell>{formatDate(user.date_of_birth)}</TableCell>
                    <TableCell>
                      {SEX_LABELS[user.sex as keyof typeof SEX_LABELS]}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                ユーザーが登録されていません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
