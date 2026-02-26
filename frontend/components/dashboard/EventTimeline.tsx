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
    <div className="relative bg-base-dark/40 border border-divider p-6">
      {/* Top accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-primary" />

      <h3 className="text-[11px] font-bold text-muted/60 uppercase tracking-[0.15em] mb-6">
        Events per Hour (24h)
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(30, 30, 30, 0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{
                fill: "#444444",
                fontSize: 10,
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 500,
              }}
              axisLine={{ stroke: "rgba(30, 30, 30, 0.12)" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{
                fill: "#444444",
                fontSize: 10,
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: 500,
              }}
              axisLine={{ stroke: "rgba(30, 30, 30, 0.12)" }}
              tickLine={false}
              allowDecimals={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#E4E2DD",
                border: "2px solid #1E1E1E",
                borderRadius: "0",
                color: "#1E1E1E",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13px",
                fontWeight: "500",
                boxShadow: "4px 4px 0 0 #1E1E1E",
              }}
              cursor={{ fill: "rgba(219, 74, 43, 0.06)" }}
              itemStyle={{ color: "#DB4A2B", fontFamily: "'Satoshi', sans-serif" }}
              labelStyle={{
                color: "#444444",
                fontFamily: "'Satoshi', sans-serif",
                marginBottom: "4px",
              }}
            />
            <Bar
              dataKey="count"
              fill="#DB4A2B"
              radius={[0, 0, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
