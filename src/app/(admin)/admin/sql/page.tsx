import type { Metadata } from "next";
import { SqlManager } from "@/components/admin/sql-manager";

export const metadata: Metadata = {
  title: "Quản lý SQL | Quản trị MeowMarket",
  description: "Trình quản lý dữ liệu SQL trực tiếp trong admin MeowMarket."
};

export default function AdminSqlRoute() {
  return <SqlManager />;
}
