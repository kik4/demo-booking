"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminService } from "../../_actions/getServices";
import { deleteServiceAction } from "../_actions/deleteServiceAction";

interface ServiceDeleteDialogProps {
  service: AdminService;
  trigger: React.ReactNode;
}

export function ServiceDeleteDialog({
  service,
  trigger,
}: ServiceDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteServiceAction(service.id);
      if ("success" in result && result.success) {
        setOpen(false);
      } else {
        console.error("削除に失敗しました:", result.error);
      }
    } catch (error) {
      console.error("削除エラー:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>サービス削除確認</AlertDialogTitle>
          <AlertDialogDescription>
            「{service.name}」を削除しますか？
            <br />
            この操作は取り消すことができません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
