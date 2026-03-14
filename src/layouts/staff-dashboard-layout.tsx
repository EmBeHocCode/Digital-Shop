import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { StaffSidebar } from "@/components/dashboard/staff-sidebar";

export function StaffDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <StaffSidebar />
      <div className="min-w-0 space-y-6">
        <DashboardTopbar rootLabel="Nhân viên" />
        {children}
      </div>
    </div>
  );
}
