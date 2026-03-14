"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function OrdersChart({
  data
}: {
  data: Array<{ name: string; orders: number }>;
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#F2E9EF" vertical={false} />
          <XAxis dataKey="name" stroke="#7A8AAA" />
          <YAxis stroke="#7A8AAA" />
          <Tooltip />
          <Bar dataKey="orders" fill="#6C8CFF" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
