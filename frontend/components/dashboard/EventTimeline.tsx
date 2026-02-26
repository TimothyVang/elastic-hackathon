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
    <div className="bg-surface-overlay/30 backdrop-blur-glass border border-border-subtle rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-cyan/30 transition-colors duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <h3 className="text-sm font-mono tracking-widest text-cyber-cyan uppercase mb-6 relative z-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
        Events per Hour (24h)
      </h3>
      <div className="h-64 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 47, 62, 0.5)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }}
              axisLine={{ stroke: "rgba(42, 47, 62, 0.5)" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }}
              axisLine={{ stroke: "rgba(42, 47, 62, 0.5)" }}
              tickLine={false}
              allowDecimals={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 13, 20, 0.8)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                borderRadius: "12px",
                color: "#e5e7eb",
                boxShadow: "0 0 20px rgba(0, 240, 255, 0.15)",
                backdropFilter: "blur(12px)",
              }}
              cursor={{ fill: "rgba(0, 240, 255, 0.05)" }}
              itemStyle={{ color: "#00f0ff", fontFamily: "monospace" }}
              labelStyle={{ color: "#9ca3af", fontFamily: "monospace", marginBottom: "4px" }}
            />
            <Bar
              dataKey="count"
              fill="#00f0ff"
              radius={[4, 4, 0, 0]}
              className="drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
