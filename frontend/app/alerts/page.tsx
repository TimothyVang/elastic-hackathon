"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import AlertDrawer from "@/components/ui/AlertDrawer";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { SecurityAlert } from "@/lib/types";

const SEVERITY_OPTIONS = ["", "critical", "high", "medium", "low"];
const CATEGORY_OPTIONS = [
  "",
  "network",
  "process",
  "authentication",
  "email",
  "file",
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (severity) params.set("severity", severity);
    if (category) params.set("category", category);
    if (search) params.set("q", search);

    fetch(`/api/alerts?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setAlerts(d.alerts);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [severity, category, search]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Security Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} alerts in the security-alerts index
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search alerts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchAlerts()}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-64"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-overlay border-b border-border-subtle">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Source IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Host
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  MITRE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {alerts.map((a, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedAlert(a)}
                  className="hover:bg-surface-overlay/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {safeFormat(a["@timestamp"])}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={a.alert?.severity} />
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-sm truncate">
                    {a.message || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {a.event?.category || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {a.source?.ip || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {a.host?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <MitreBadge techniqueId={a.threat?.technique?.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}

function safeFormat(ts: string | undefined): string {
  if (!ts) return "—";
  try {
    return format(new Date(ts), "HH:mm:ss MMM d");
  } catch {
    return ts;
  }
}
