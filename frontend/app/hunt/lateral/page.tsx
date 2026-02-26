"use client";

import { useEffect, useState } from "react";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { esqlToRows } from "@/lib/utils";
import type { LateralMovementResult } from "@/lib/types";

export default function LateralPage() {
  const [data, setData] = useState<LateralMovementResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hunt/lateral")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const rows = esqlToRows(d.columns, d.values);
        setData(rows as unknown as LateralMovementResult[]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Lateral Movement Detection
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Authentication events where the same user/IP accessed multiple hosts
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {data.length} multi-host auth pattern{data.length !== 1 ? "s" : ""}{" "}
            detected
          </p>

          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-overlay border-b border-border-subtle">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Source IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Host Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Hosts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    First Seen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Last Seen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-surface-overlay/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                      {row["source.ip"]}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      {row["user.name"] || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-red-400 font-bold">
                        {row.host_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {Array.isArray(row.hosts)
                        ? row.hosts.join(", ")
                        : String(row.hosts || "—")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {row.first_seen
                        ? new Date(row.first_seen).toLocaleTimeString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {row.last_seen
                        ? new Date(row.last_seen).toLocaleTimeString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge
                        severity={
                          row.host_count >= 3
                            ? "critical"
                            : row.host_count >= 2
                              ? "high"
                              : "medium"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
