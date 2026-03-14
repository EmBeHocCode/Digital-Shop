import { staffSidebarItems } from "@/config/site";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export function StaffSidebar() {
  return <SidebarShell title="Bảng điều khiển nhân viên" items={staffSidebarItems} />;
}
