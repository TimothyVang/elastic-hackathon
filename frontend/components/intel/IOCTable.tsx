"use client";

import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { ThreatIntel } from "@/lib/types";

export default function IOCTable({ data }: { data: ThreatIntel[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 border border-divider bg-base-dark/20">
        <p className="text-muted/50 text-sm">No IOCs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-divider">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-base-dark/40 border-b-2 border-primary/10">
            {["Type", "Value", "Description", "Severity", "Confidence", "MITRE", "Source"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted/50 uppercase tracking-[0.15em]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {data.map((ioc, i) => (
            <tr key={i} className="hover:bg-base-dark/30 transition-colors">
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] bg-accent-red/8 text-accent-red border border-accent-red/20">
                  {ioc.ioc?.type || "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-primary/80 font-medium max-w-[200px] truncate">
                {ioc.ioc?.value || "—"}
              </td>
              <td className="px-4 py-3 text-xs text-muted/70 max-w-xs">
                {ioc.ioc?.description || "—"}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={ioc.severity} />
              </td>
              <td className="px-4 py-3 text-xs font-bold text-primary/60">
                {ioc.confidence != null ? `${(ioc.confidence * 100).toFixed(0)}%` : "—"}
              </td>
              <td className="px-4 py-3">
                <MitreBadge techniqueId={ioc.threat?.technique?.id} techniqueName={ioc.threat?.technique?.name} />
              </td>
              <td className="px-4 py-3 text-xs text-muted/50">
                {ioc.source || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
