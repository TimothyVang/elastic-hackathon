"use client";

import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { ThreatIntel } from "@/lib/types";

export default function IOCTable({ data }: { data: ThreatIntel[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">No IOCs found</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-overlay border-b border-border-subtle">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Confidence
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              MITRE
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Source
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((ioc, i) => (
            <tr
              key={i}
              className="hover:bg-surface-overlay/50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {ioc.ioc?.type || "—"}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-200 max-w-[200px] truncate">
                {ioc.ioc?.value || "—"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 max-w-xs">
                {ioc.ioc?.description || "—"}
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={ioc.severity} />
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {ioc.confidence != null
                  ? `${(ioc.confidence * 100).toFixed(0)}%`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <MitreBadge
                  techniqueId={ioc.threat?.technique?.id}
                  techniqueName={ioc.threat?.technique?.name}
                />
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {ioc.source || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
