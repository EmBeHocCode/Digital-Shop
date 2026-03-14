import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getNotifications } from "@/services/content-service";

export default async function AdminNotificationsRoute() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Trung tâm thông báo</h1>
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{notification.title}</p>
              <p className="mt-1 text-sm text-muted">{notification.description}</p>
            </div>
            <StatusBadge status={notification.level} />
          </div>
        </Card>
      ))}
    </div>
  );
}
