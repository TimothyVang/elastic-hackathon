import { clsx } from "clsx";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
  subtext?: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  red: { bg: "bg-red-500/10", text: "text-red-400", icon: "text-red-400" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", icon: "text-orange-400" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: "text-yellow-400" },
  green: { bg: "bg-green-500/10", text: "text-green-400", icon: "text-green-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "text-blue-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "text-purple-400" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={clsx("text-2xl font-bold", c.text)}>{value}</p>
          {subtext && (
            <p className="text-xs text-gray-500 mt-1">{subtext}</p>
          )}
        </div>
        <div className={clsx("p-2.5 rounded-lg", c.bg)}>
          <Icon className={clsx("w-5 h-5", c.icon)} />
        </div>
      </div>
    </div>
  );
}
