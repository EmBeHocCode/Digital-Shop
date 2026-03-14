import { userSidebarItems } from "@/config/site";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export function UserSidebar() {
  return <SidebarShell title="User Center" items={userSidebarItems} />;
}
