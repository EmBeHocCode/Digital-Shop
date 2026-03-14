import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentProfileData } from "@/services/profile-service";

export async function NotificationSettingsPage() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-black text-ink">Cài đặt thông báo</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            "Cập nhật đơn hàng",
            "Cập nhật thanh toán",
            "Phản hồi phiếu hỗ trợ",
            "Khuyến mãi mới"
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4">
              <p className="font-medium text-ink">{label}</p>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                Bật
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-2xl font-bold text-ink">Trung tâm thông báo</h2>
        {profile.notifications.length ? (
          <div className="mt-5 space-y-3">
            {profile.notifications.map((notification) => (
              <div key={notification.id} className="flex items-start justify-between gap-4 rounded-[22px] border border-border bg-white px-4 py-4">
                <div>
                  <p className="font-semibold text-ink">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted">{notification.description}</p>
                </div>
                <StatusBadge status={notification.level} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Chưa có thông báo"
              description="Tài khoản này hiện chưa nhận cập nhật đơn hàng, thanh toán hay phiếu hỗ trợ nào."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
