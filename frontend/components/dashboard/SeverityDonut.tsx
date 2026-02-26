"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

// Remap colors to Raw Form palette
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#DB4A2B",
  High: "#F8A348",
  Medium: "#FF89A9",
  Low: "#1E1E1E",
};

export default function SeverityDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  // Apply Raw Form colors
  const coloredData = data.map((d) => ({
    ...d,
    color: SEVERITY_COLORS[d.name] || d.color,
  }));

  return (
    <div className="relative bg-base-dark/40 border border-divider p-6">
      {/* Top accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-accent-pink" />

      <h3 className="text-[11px] font-bold text-muted/60 uppercase tracking-[0.15em] mb-6">
        Severity Distribution
      </h3>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              animationDuration={1200}
              stroke="none"
            >
              {coloredData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
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
              itemStyle={{ fontFamily: "'Satoshi', sans-serif" }}
              labelStyle={{ display: "none" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                color: "#444444",
                fontFamily: "'Satoshi', sans-serif",
                fontWeight: "500",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
              iconType="square"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-16px" }}>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-primary tracking-[-0.03em]">
              {total}
            </div>
            <div className="text-[9px] font-bold text-muted/50 uppercase tracking-[0.2em]">
              Total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
