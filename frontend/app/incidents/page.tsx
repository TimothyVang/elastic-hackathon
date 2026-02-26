"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import type { IncidentLog } from "@/lib/types";

const STATUS_OPTIONS = ["", "open", "investigating", "contained", "resolved"];
const PRIORITY_OPTIONS = ["", "P1", "P2", "P3", "P4"];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (search) params.set("q", search);

    fetch(`/api/incidents?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setIncidents(d.incidents);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, priority, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Incident Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} incident{total !== 1 ? "s" : ""} in the incident-log index
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          className="bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-64"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No incidents found. Incidents are created when the DCO Triage Agent
          completes an investigation.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-overlay border-b border-border-subtle">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Triage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Events
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Hosts
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {incidents.map((inc, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-overlay/50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {safeFormat(inc["@timestamp"])}
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                    {inc.incident?.title || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={inc.incident?.severity} />
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-300">
                    {inc.incident?.priority || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.incident?.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.triage_result} />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {inc.event_count ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {inc.affected_hosts?.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function safeFormat(ts: string | undefined): string {
  if (!ts) return "—";
  try {
    return format(new Date(ts), "MMM d HH:mm");
  } catch {
    return ts;
  }
}
