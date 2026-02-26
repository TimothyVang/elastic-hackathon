"use client";

import { clsx } from "clsx";
import { type LucideIcon } from "lucide-react";
import CountUp from "react-countup";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
  subtext?: string;
}

const COLOR_MAP: Record<
  string,
  { accent: string; text: string; bg: string }
> = {
  red:    { accent: "#DB4A2B", text: "text-accent-red", bg: "bg-accent-red/8" },
  orange: { accent: "#F8A348", text: "text-accent-orange", bg: "bg-accent-orange/8" },
  yellow: { accent: "#F8A348", text: "text-accent-orange", bg: "bg-accent-orange/8" },
  green:  { accent: "#22c55e", text: "text-green-600", bg: "bg-green-500/8" },
  blue:   { accent: "#1E1E1E", text: "text-primary", bg: "bg-primary/5" },
  purple: { accent: "#FF89A9", text: "text-accent-pink", bg: "bg-accent-pink/8" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: StatCardProps) {
  const c = COLOR_MAP[color];
  const isNumber = typeof value === "number";

  return (
    <div
      className="group relative bg-base-dark/50 border border-divider p-6 transition-all duration-300 hover:shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px]"
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 w-full h-[3px]"
        style={{ backgroundColor: c.accent }}
      />

      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-medium text-muted uppercase tracking-[0.15em]">
          {label}
        </p>
        <div className={clsx("p-2 rounded-none", c.bg)}>
          <Icon className={clsx("w-4 h-4", c.text)} />
        </div>
      </div>

      <div>
        <div className={clsx("text-4xl font-display font-bold tracking-[-0.03em]", c.text)}>
          {isNumber ? (
            <CountUp end={value as number} duration={2} separator="," useEasing />
          ) : (
            value
          )}
        </div>
        {subtext && (
          <p className="text-[11px] text-muted/60 mt-2 tracking-[0.1em] uppercase">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
