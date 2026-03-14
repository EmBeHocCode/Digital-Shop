import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getCurrentProfileData } from "@/services/profile-service";
import { formatCurrency, formatDate } from "@/utils/format";

export async function ProfileOverview() {
  const profile = await getCurrentProfileData();
  const user = profile.user;

  if (!user) {
    return (
      <EmptyState
        title="Không đọc được thông tin tài khoản"
        description="Phiên đăng nhập hiện tại không hợp lệ. Hãy đăng nhập lại để tiếp tục."
        ctaLabel="Đăng nhập lại"
        ctaLink="/login"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#fff0f6] to-[#eef3ff]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">Tài khoản</p>
            <h1 className="mt-3 text-3xl font-black text-ink">{user.fullName}</h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              {user.email} • {user.phone}
            </p>
          </div>
          <UserAvatar
            fullName={user.fullName}
            avatar={user.avatar}
            size={80}
            className="ring-4 ring-white/70"
          />
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Tổng đơn hàng</p>
          <p className="mt-3 text-3xl font-black text-ink">{profile.orders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Đã chi tiêu</p>
          <p className="mt-3 text-3xl font-black text-ink">
            {formatCurrency(profile.spentTotal)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Sản phẩm yêu thích</p>
          <p className="mt-3 text-3xl font-black text-ink">{profile.wishlistProducts.length}</p>
        </Card>
      </div>
      {profile.latestOrder ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Đơn gần nhất</p>
              <p className="mt-2 text-2xl font-bold text-ink">{profile.latestOrder.orderCode}</p>
            </div>
            <Badge label={profile.latestOrder.status} status={profile.latestOrder.status} />
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            Tạo ngày {formatDate(profile.latestOrder.createdAt)} với tổng thanh toán {formatCurrency(profile.latestOrder.total)}.
          </p>
        </Card>
      ) : (
        <EmptyState
          title="Tài khoản mới chưa có đơn hàng"
          description="Khi bạn tạo đơn đầu tiên, thống kê thanh toán và timeline gần nhất sẽ xuất hiện tại đây."
          ctaLabel="Khám phá sản phẩm"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
