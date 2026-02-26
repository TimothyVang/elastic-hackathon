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

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string; borderHover: string; glow: string }> = {
  red: { bg: "bg-cyber-red/10", text: "text-cyber-red drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]", icon: "text-cyber-red", borderHover: "hover:border-cyber-red/50", glow: "hover:shadow-[0_0_30px_rgba(255,0,60,0.15)]" },
  orange: { bg: "bg-cyber-gold/10", text: "text-cyber-gold drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]", icon: "text-cyber-gold", borderHover: "hover:border-cyber-gold/50", glow: "hover:shadow-[0_0_30px_rgba(255,184,0,0.15)]" },
  yellow: { bg: "bg-cyber-gold/10", text: "text-cyber-gold drop-shadow-[0_0_8px_rgba(255,184,0,0.8)]", icon: "text-cyber-gold", borderHover: "hover:border-cyber-gold/50", glow: "hover:shadow-[0_0_30px_rgba(255,184,0,0.15)]" },
  green: { bg: "bg-green-500/10", text: "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]", icon: "text-green-400", borderHover: "hover:border-green-500/50", glow: "hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]" },
  blue: { bg: "bg-cyber-cyan/10", text: "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]", icon: "text-cyber-cyan", borderHover: "hover:border-cyber-cyan/50", glow: "hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]" },
  purple: { bg: "bg-cyber-violet/10", text: "text-cyber-violet drop-shadow-[0_0_8px_rgba(184,0,255,0.8)]", icon: "text-cyber-violet", borderHover: "hover:border-cyber-violet/50", glow: "hover:shadow-[0_0_30px_rgba(184,0,255,0.15)]" },
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
    <div className={clsx(
      "group relative bg-surface-overlay/30 backdrop-blur-glass border border-border-subtle rounded-2xl p-6 transition-all duration-500 flex flex-col justify-between overflow-hidden",
      c.borderHover,
      c.glow
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between z-10 w-full mb-4">
        <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.15em] opacity-80">
          {label}
        </p>
        <div className={clsx("p-2.5 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", c.bg)}>
          <Icon className={clsx("w-5 h-5", c.icon)} />
        </div>
      </div>

      <div className="relative z-10">
        <div className={clsx("text-4xl font-bold tracking-tight font-sans", c.text)}>
          {isNumber ? (
            <CountUp end={value as number} duration={2.5} separator="," useEasing />
          ) : (
            value
          )}
        </div>
        {subtext && (
          <p className="text-xs text-gray-500 mt-2 font-mono tracking-wide uppercase">{subtext}</p>
        )}
      </div>
    </div>
  );
}
