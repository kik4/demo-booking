import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavProjects } from "./NavProjects";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <NavProjects />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
