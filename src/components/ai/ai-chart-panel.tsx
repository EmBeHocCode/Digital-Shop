"use client";

import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";

const data = [
  { label: "T2", score: 62 },
  { label: "T3", score: 68 },
  { label: "T4", score: 74 },
  { label: "T5", score: 71 },
  { label: "T6", score: 79 },
  { label: "T7", score: 84 }
];

export function AIChartPanel() {
  return (
    <ChartCard
      title="Phân tích doanh số bằng AI"
      description="Mô phỏng dữ liệu mà giao diện sẽ nhận từ dịch vụ AI Python FastAPI sau này."
    >
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="#F1E6EC" vertical={false} />
            <XAxis dataKey="label" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip />
            <Area dataKey="score" stroke="#FF7FA9" fill="#FFD9E6" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
