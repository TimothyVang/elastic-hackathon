"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import type { BeaconingResult } from "@/lib/types";

const columns: Column<BeaconingResult>[] = [
  { key: "destination.ip", header: "Dest IP", render: (r) => r["destination.ip"] },
  { key: "destination.domain", header: "Domain", render: (r) => r["destination.domain"] || "—" },
  { key: "source.ip", header: "Source IP", render: (r) => r["source.ip"] },
  {
    key: "beacon_count",
    header: "Beacons",
    render: (r) => (
      <span className="font-mono text-orange-400">{r.beacon_count}</span>
    ),
  },
  {
    key: "avg_interval_seconds",
    header: "Avg Interval",
    render: (r) => (
      <span className="font-mono">
        {r.avg_interval_seconds ? `${Math.round(r.avg_interval_seconds)}s` : "—"}
      </span>
    ),
  },
  {
    key: "total_bytes",
    header: "Total Bytes",
    render: (r) => formatBytes(r.total_bytes),
  },
  {
    key: "duration_minutes",
    header: "Duration",
    render: (r) => (r.duration_minutes ? `${r.duration_minutes}m` : "—"),
  },
];

export default function BeaconingTable({
  data,
  onRowClick,
}: {
  data: BeaconingResult[];
  onRowClick?: (row: BeaconingResult) => void;
}) {
  return (
    <DataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      data={data as unknown as Record<string, unknown>[]}
      emptyMessage="No beaconing patterns detected"
      onRowClick={onRowClick as unknown as ((row: Record<string, unknown>) => void) | undefined}
    />
  );
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
