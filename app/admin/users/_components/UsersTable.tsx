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
import { ROLE_CODES, ROLE_LABELS } from "@/constants/roleCode";
import { SEX_LABELS } from "@/constants/sexCode";
import { formatDateStringYMD } from "@/lib/formatDateStringYMD";
import type {
  AdminUser,
  SortDirection,
  SortKey,
} from "../../_actions/getUsersAction";

interface UsersTableProps {
  users: AdminUser[];
  currentSortKey: SortKey;
  currentSortDirection: SortDirection;
}

export function UsersTable({
  users,
  currentSortKey,
  currentSortDirection,
}: UsersTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS];
  };

  const createSortUrl = (key: SortKey) => {
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
    sortKey: SortKey;
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
            <SortableHeader sortKey="name">名前</SortableHeader>
            <SortableHeader sortKey="name_hiragana">ふりがな</SortableHeader>
            <SortableHeader sortKey="date_of_birth">生年月日</SortableHeader>
            <SortableHeader sortKey="sex">性別</SortableHeader>
            <SortableHeader sortKey="role">権限</SortableHeader>
            <SortableHeader sortKey="created_at">登録日</SortableHeader>
            <SortableHeader sortKey="updated_at">更新日</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.name_hiragana}</TableCell>
              <TableCell>{formatDateStringYMD(user.date_of_birth)}</TableCell>
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
              <TableCell>{formatDateStringYMD(user.created_at)}</TableCell>
              <TableCell>{formatDateStringYMD(user.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          ユーザーが登録されていません
        </div>
      )}
    </>
  );
}
