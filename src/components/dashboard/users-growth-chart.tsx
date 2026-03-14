"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function UsersGrowthChart({
  data
}: {
  data: Array<{ name: string; users: number }>;
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#F2E9EF" vertical={false} />
          <XAxis dataKey="name" stroke="#7A8AAA" />
          <YAxis stroke="#7A8AAA" />
          <Tooltip />
          <Line type="monotone" dataKey="users" stroke="#FFD166" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
