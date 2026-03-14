import type { ReactNode } from "react";
import { UserDashboardLayout } from "@/layouts/user-dashboard-layout";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
