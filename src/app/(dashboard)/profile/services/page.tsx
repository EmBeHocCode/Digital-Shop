import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";

export default async function ProfileServicesRoute() {
  const profile = await getCurrentProfileData();
  const services = profile.services;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Dịch vụ của tôi</h1>
      {services.length ? (
        services.map((service) => (
          <Card key={service.id}>
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted">Dịch vụ</p>
                  <p className="mt-1 font-bold text-ink">{service.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Loại dịch vụ</p>
                  <p className="mt-1 font-bold text-ink">{service.type}</p>
                </div>
                {"ipAddress" in service ? (
                  <>
                    <div>
                      <p className="text-sm text-muted">Địa chỉ IP</p>
                      <p className="mt-1 font-bold text-ink">{service.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted">Tên đăng nhập</p>
                      <p className="mt-1 font-bold text-ink">{service.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted">Mật khẩu</p>
                      <p className="mt-1 font-bold text-ink">{service.password}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted">Gia hạn</p>
                      <p className="mt-1 font-bold text-ink">{service.renewAt ?? "Chưa có"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted">Nhật ký bàn giao</p>
                      <p className="mt-1 font-bold text-ink">
                        {service.deliveryLog?.join(" • ") ?? "Đang chờ cấp phát"}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-3">
                <Badge label={service.status} status={service.status} />
                {"panelUrl" in service ? (
                  <Button href={service.panelUrl} variant="outline">
                    Bảng điều khiển
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState
          title="Chưa có dịch vụ nào"
          description="VPS, dịch vụ cloud hoặc sản phẩm giao hàng số sẽ xuất hiện ở đây sau khi đơn của bạn hoàn tất."
          ctaLabel="Xem sản phẩm"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
