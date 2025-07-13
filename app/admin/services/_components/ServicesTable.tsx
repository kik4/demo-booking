"use client";

import { ChevronDownIcon, ChevronUpIcon, Edit, Trash2 } from "lucide-react";
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
import type {
  AdminService,
  SortDirection,
  SortKey,
} from "../../_actions/getServicesAction";
import { ServiceDeleteDialog } from "./ServiceDeleteDialog";
import { ServiceForm } from "./ServiceForm";

interface ServicesTableProps {
  services: AdminService[];
  currentSortKey: SortKey;
  currentSortDirection: SortDirection;
}

export function ServicesTable({
  services,
  currentSortKey,
  currentSortDirection,
}: ServicesTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString("ja-JP")}`;
  };

  const formatDuration = (duration: number) => {
    return `${duration}分`;
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
            <SortableHeader sortKey="name">サービス名</SortableHeader>
            <SortableHeader sortKey="duration">所要時間</SortableHeader>
            <SortableHeader sortKey="price">料金</SortableHeader>
            <SortableHeader sortKey="created_at">作成日時</SortableHeader>
            <SortableHeader sortKey="updated_at">更新日時</SortableHeader>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.id}</TableCell>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{formatDuration(service.duration)}</TableCell>
              <TableCell className="font-medium text-green-600">
                {formatPrice(service.price)}
              </TableCell>
              <TableCell>{formatDateStringYMDHM(service.created_at)}</TableCell>
              <TableCell>{formatDateStringYMDHM(service.updated_at)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <ServiceForm
                    service={service}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <ServiceDeleteDialog
                    service={service}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {services.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          サービスが登録されていません
        </div>
      )}
    </>
  );
}
