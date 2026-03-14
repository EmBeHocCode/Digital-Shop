"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Notification } from "@/types/domain";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/notifications")
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) {
          return;
        }

        setNotifications((payload.notifications as Notification[]) ?? []);
      })
      .catch(() => {
        if (mounted) {
          setNotifications([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="w-[360px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">Thông báo mới</h3>
        <Link href="/profile/notifications" className="text-sm font-semibold text-primary">
          Xem tất cả
        </Link>
      </div>
      <div className="space-y-3">
        {notifications.slice(0, 4).map((notification) => (
          <Link
            key={notification.id}
            href={notification.link ?? "#"}
            className="block rounded-[20px] border border-border/70 bg-slate-50/70 p-4 transition hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{notification.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{notification.description}</p>
              </div>
              <StatusBadge status={notification.level} />
            </div>
          </Link>
        ))}
        {!notifications.length ? (
          <p className="rounded-[20px] bg-slate-50/70 p-4 text-sm text-muted">
            Chưa có thông báo mới từ hệ thống.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
