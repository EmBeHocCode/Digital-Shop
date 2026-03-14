import { adminSidebarItems } from "@/config/site";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export function AdminSidebar() {
  return <SidebarShell title="Bảng điều khiển quản trị" items={adminSidebarItems} />;
}
