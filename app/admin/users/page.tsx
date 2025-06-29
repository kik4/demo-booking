import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_CODES, ROLE_LABELS } from "@/constants/roleCode";
import { SEX_LABELS } from "@/constants/sexCode";
import { getUsers } from "../actions";

export default async function UsersPage() {
  const users = await getUsers();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  };

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS];
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">ユーザー一覧</h1>

        <div className="rounded-lg bg-white p-6 shadow">
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
                        user.role === ROLE_CODES.ADMIN
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
  );
}
