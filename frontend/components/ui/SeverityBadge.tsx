import { clsx } from "clsx";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function SeverityBadge({
  severity,
}: {
  severity: string | undefined;
}) {
  const level = (severity || "unknown").toLowerCase();
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        SEVERITY_STYLES[level] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
      )}
    >
      {level}
    </span>
  );
}
