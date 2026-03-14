import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <div className="min-w-0 space-y-6">
        <DashboardTopbar rootLabel="Admin" />
        {children}
      </div>
    </div>
  );
}
