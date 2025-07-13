import {
  getUsersAction,
  type SortDirection,
  type SortKey,
} from "../_actions/getUsersAction";
import { UsersTable } from "./_components/UsersTable";

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const sortKey = (params.sortKey as SortKey) || "created_at";
  const sortDirection = (params.sortDirection as SortDirection) || "desc";

  const users = await getUsersAction(sortKey, sortDirection);

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">ユーザー一覧</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <UsersTable
            users={users}
            currentSortKey={sortKey}
            currentSortDirection={sortDirection}
          />
        </div>
      </div>
    </div>
  );
}
