import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-accent-red/10 text-accent-red border-accent-red/25",
  investigating: "bg-accent-orange/10 text-accent-orange border-accent-orange/25",
  contained: "bg-blue-600/10 text-blue-700 border-blue-600/25",
  resolved: "bg-green-600/10 text-green-700 border-green-600/25",
  true_positive: "bg-accent-red/10 text-accent-red border-accent-red/25",
  false_positive: "bg-primary/5 text-muted/60 border-primary/10",
  needs_investigation: "bg-accent-orange/10 text-accent-orange border-accent-orange/25",
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
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border",
        STATUS_STYLES[s] || "bg-primary/5 text-muted/50 border-primary/10"
      )}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}
