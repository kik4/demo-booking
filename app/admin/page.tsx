import { Calendar, Clock, UserCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_CODES } from "@/constants/roleCode";
import { getAllBookings, getUsers } from "./actions";

export default async function AdminPage() {
  const users = await getUsers();
  const bookings = await getAllBookings();

  const adminUsers = users.filter((user) => user.role === ROLE_CODES.ADMIN);
  const regularUsers = users.filter((user) => user.role === ROLE_CODES.USER);
  const todayBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.start_time);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">
          管理者ダッシュボード
        </h1>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                総ユーザー数
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{users.length}</div>
              <p className="text-muted-foreground text-xs">
                管理者: {adminUsers.length} | 一般: {regularUsers.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">総予約数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{bookings.length}</div>
              <p className="text-muted-foreground text-xs">全期間の予約合計</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">本日の予約</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{todayBookings.length}</div>
              <p className="text-muted-foreground text-xs">今日の予約件数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">管理者数</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{adminUsers.length}</div>
              <p className="text-muted-foreground text-xs">管理権限ユーザー</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>最近の予約</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <div>
                      <div className="font-medium">{booking.profile.name}</div>
                      <div className="text-gray-500 text-sm">
                        {booking.service_name}
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">
                      {new Date(booking.start_time).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="py-4 text-center text-gray-500">
                    予約がありません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近登録されたユーザー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500 text-sm">
                        {user.name_hiragana}
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="py-4 text-center text-gray-500">
                    ユーザーがいません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
