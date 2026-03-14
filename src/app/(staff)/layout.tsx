import type { ReactNode } from "react";
import { PublicLayout } from "@/layouts/public-layout";

export default function StaffGroupLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
