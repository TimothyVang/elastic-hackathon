import { clsx } from "clsx";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-accent-red/10 text-accent-red border-accent-red/30",
  high: "bg-accent-orange/10 text-accent-orange border-accent-orange/40",
  medium: "bg-accent-pink/10 text-accent-pink border-accent-pink/30",
  low: "bg-primary/5 text-muted border-primary/15",
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
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border",
        SEVERITY_STYLES[level] || "bg-primary/5 text-muted/50 border-primary/10"
      )}
    >
      {level}
    </span>
  );
}
