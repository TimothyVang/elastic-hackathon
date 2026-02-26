"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

export default function SeverityDonut({ data }: Props) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        Alert Severity Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1c2030",
                border: "1px solid #2a2f3e",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
