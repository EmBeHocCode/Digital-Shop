import type { ReactNode } from "react";
import { StaffDashboardLayout } from "@/layouts/staff-dashboard-layout";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <StaffDashboardLayout>{children}</StaffDashboardLayout>;
}
