"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

export default function SeverityDonut({ data }: Props) {
  return (
    <div className="bg-surface-overlay/30 backdrop-blur-glass border border-border-subtle rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-violet/30 transition-colors duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <h3 className="text-sm font-mono tracking-widest text-cyber-violet uppercase mb-6 relative z-10 drop-shadow-[0_0_8px_rgba(184,0,255,0.5)]">
        Alert Severity Distribution
      </h3>
      <div className="h-64 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              animationDuration={1500}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  className="drop-shadow-[0_0_5px_currentColor] transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 13, 20, 0.8)",
                border: "1px solid rgba(184, 0, 255, 0.3)",
                borderRadius: "12px",
                color: "#e5e7eb",
                boxShadow: "0 0 20px rgba(184, 0, 255, 0.15)",
                backdropFilter: "blur(12px)",
              }}
              itemStyle={{ fontFamily: "monospace", fontSize: "14px" }}
              labelStyle={{ display: "none" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
