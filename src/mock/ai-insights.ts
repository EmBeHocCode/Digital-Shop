import { AiInsight } from "@/types/domain";

export const aiInsights: AiInsight[] = [
  {
    id: "ai-01",
    title: "Doanh số nhóm Cloud tăng mạnh",
    description: "Cloud Gaming và Cloud Workstation có xu hướng tăng trong 14 ngày gần nhất.",
    value: "+18%",
    status: "READY",
    trend: "up"
  },
  {
    id: "ai-02",
    title: "Tồn kho gift card cần chú ý",
    description: "Một số mã Steam Wallet và Google Play đang về ngưỡng thấp.",
    value: "7 mã",
    status: "WARNING",
    trend: "down"
  },
  {
    id: "ai-03",
    title: "Xu hướng người dùng mới",
    description: "Tệp khách hàng 18-24 tuổi có xu hướng mua cloud gaming vào cuối tuần.",
    value: "Cuối tuần",
    status: "READY",
    trend: "steady"
  },
  {
    id: "ai-04",
    title: "Gợi ý khuyến mãi chéo",
    description: "Khách mua VPS Gaming có xác suất mua thêm gift card Steam Wallet cao hơn nhóm khác.",
    value: "32%",
    status: "READY",
    trend: "up"
  }
];
