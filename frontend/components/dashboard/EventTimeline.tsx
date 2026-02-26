"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { hour: string; count: number }[];
}

export default function EventTimeline({ data }: Props) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        Events per Hour (24h)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#2a2f3e" }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#2a2f3e" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1c2030",
                border: "1px solid #2a2f3e",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
