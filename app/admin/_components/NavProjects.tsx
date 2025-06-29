"use client";

import { Calendar, Home, Users } from "lucide-react";
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
  ],
};

export function NavProjects() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>管理メニュー</SidebarGroupLabel>
      <SidebarMenu>
        {data.projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
