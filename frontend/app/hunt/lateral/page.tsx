"use client";

import { useEffect, useState } from "react";
import { esqlToRows } from "@/lib/utils";
import type { LateralMovementResult } from "@/lib/types";

export default function LateralPage() {
  const [data, setData] = useState<LateralMovementResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hunt/lateral")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setData(esqlToRows(d.columns, d.values) as unknown as LateralMovementResult[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.5rem)] uppercase tracking-[-0.04em] leading-[0.85] text-primary">
          Lateral Movement
        </h1>
        <p className="text-sm text-muted/60 mt-2">Same user/IP authenticating to multiple hosts in 24 hours</p>
      </div>

      {error && <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-8 text-muted/50 text-sm uppercase tracking-wider">Scanning for lateral movement...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 border border-divider bg-base-dark/20">
          <p className="text-muted/50 text-sm">No lateral movement patterns detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-divider">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-base-dark/40 border-b-2 border-primary/10">
                {["Source IP", "User", "Host Count", "Hosts", "First Seen", "Last Seen", "Risk"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted/50 uppercase tracking-[0.15em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {data.map((row, i) => {
                const hostCount = Number(row.host_count) || 0;
                const hosts = Array.isArray(row.hosts) ? row.hosts.join(", ") : String(row.hosts || "—");
                return (
                  <tr key={i} className="hover:bg-base-dark/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-primary/80 font-medium">{row["source.ip"] || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted/70">{row["user.name"] || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-display font-bold text-accent-red">{hostCount}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted/60 max-w-xs truncate">{hosts}</td>
                    <td className="px-4 py-3 text-xs text-muted/50">{row.first_seen ? new Date(row.first_seen).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted/50">{row.last_seen ? new Date(row.last_seen).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 border ${hostCount >= 4 ? "bg-accent-red/10 text-accent-red border-accent-red/25" : hostCount >= 3 ? "bg-accent-orange/10 text-accent-orange border-accent-orange/25" : "bg-primary/5 text-muted/60 border-divider"}`}>
                        {hostCount >= 4 ? "critical" : hostCount >= 3 ? "high" : "medium"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
