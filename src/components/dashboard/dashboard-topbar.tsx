"use client";

import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { SearchBar } from "@/components/ui/search-bar";
import { Card } from "@/components/ui/card";

function toLabel(part: string) {
  const labelMap: Record<string, string> = {
    account: "Tài khoản",
    security: "Đổi mật khẩu"
  };

  if (labelMap[part]) {
    return labelMap[part];
  }

  return part
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardTopbar({ rootLabel }: { rootLabel: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = [
    {
      label: rootLabel,
      href:
        segments[0] === "admin"
          ? "/admin"
          : segments[0] === "staff"
            ? "/staff"
            : "/profile"
    },
    ...segments.slice(1).map((segment, index) => ({
      label: toLabel(segment),
      href:
        index === segments.length - 2
          ? undefined
          : `/${segments.slice(0, index + 2).join("/")}`
    }))
  ];

  return (
    <Card className="glass-panel flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-2xl font-black text-ink">{breadcrumbItems.at(-1)?.label ?? rootLabel}</h1>
      </div>
      <div className="flex items-center gap-3 lg:w-[420px]">
        <SearchBar compact />
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm">
          <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
