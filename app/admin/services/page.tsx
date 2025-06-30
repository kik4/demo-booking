import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateStringYMD } from "@/lib/formatDateStringYMD";
import { getServices } from "../_actions/getServices";

export default async function ServicesPage() {
  const services = await getServices();

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString("ja-JP")}`;
  };

  const formatDuration = (duration: number) => {
    return `${duration}分`;
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">サービス一覧</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>サービス名</TableHead>
                <TableHead>所要時間</TableHead>
                <TableHead>料金</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead>更新日</TableHead>
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
                  <TableCell>
                    {formatDateStringYMD(service.created_at)}
                  </TableCell>
                  <TableCell>
                    {formatDateStringYMD(service.updated_at)}
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
        </div>
      </div>
    </div>
  );
}
