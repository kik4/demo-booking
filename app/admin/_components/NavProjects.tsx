"use client";

import { Calendar, Home, Settings, Users } from "lucide-react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/routes";

const data = {
  projects: [
    {
      name: "ダッシュボード",
      url: ROUTES.ADMIN.ROOT,
      icon: Home,
    },
    {
      name: "ユーザー一覧",
      url: ROUTES.ADMIN.USERS,
      icon: Users,
    },
    {
      name: "予約一覧",
      url: ROUTES.ADMIN.BOOKINGS,
      icon: Calendar,
    },
    {
      name: "サービス一覧",
      url: ROUTES.ADMIN.SERVICES,
      icon: Settings,
    },
  ],
};

export function NavProjects() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>管理メニュー</SidebarGroupLabel>
      <SidebarMenu>
        {data.projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild tooltip={item.name}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
