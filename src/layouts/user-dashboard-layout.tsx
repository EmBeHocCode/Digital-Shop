import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { UserSidebar } from "@/components/dashboard/user-sidebar";

export function UserDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <UserSidebar />
      <div className="min-w-0 space-y-6">
        <DashboardTopbar rootLabel="Tài khoản" />
        {children}
      </div>
    </div>
  );
}
