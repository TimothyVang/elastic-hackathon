import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/15 text-red-400 border-red-500/30",
  investigating: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  contained: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-400 border-green-500/30",
  true_positive: "bg-red-500/15 text-red-400 border-red-500/30",
  false_positive: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  needs_investigation: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

export default function StatusBadge({
  status,
}: {
  status: string | undefined;
}) {
  const s = (status || "unknown").toLowerCase();
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        STATUS_STYLES[s] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
      )}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}
