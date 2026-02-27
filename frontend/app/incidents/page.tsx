"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import IncidentDrawer from "@/components/ui/IncidentDrawer";
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
  const [selectedIncident, setSelectedIncident] = useState<IncidentLog | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (search) params.set("q", search);

    fetch(`/api/incidents?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setIncidents(d.incidents); setTotal(d.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, priority, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary">
          Incidents
        </h1>
        <p className="text-sm text-muted/60 mt-2">
          {total} incident{total !== 1 ? "s" : ""} in the incident-log index
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40 uppercase tracking-wider text-[12px] font-medium">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40 uppercase tracking-wider text-[12px] font-medium">
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input type="text" placeholder="Search incidents..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary placeholder-muted/30 focus:outline-none focus:border-primary/40 w-64" />
      </div>

      {error && (
        <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted/50 text-sm uppercase tracking-wider">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 border border-divider bg-base-dark/20">
          <p className="text-muted/50 text-sm">No incidents found.</p>
          <p className="text-muted/30 text-xs mt-1">Incidents are created when the DCO Triage Agent completes an investigation.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-divider">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-base-dark/40 border-b-2 border-primary/10">
                {["Time", "Title", "Severity", "Priority", "Status", "Triage", "Events", "Hosts"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted/50 uppercase tracking-[0.15em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {incidents.map((inc, i) => (
                <tr key={i} onClick={() => setSelectedIncident(inc)} className="hover:bg-base-dark/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-xs text-muted/60 whitespace-nowrap">{safeFormat(inc["@timestamp"])}</td>
                  <td className="px-4 py-3 text-primary/80 max-w-xs truncate">{inc.incident?.title || "—"}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={inc.incident?.severity} /></td>
                  <td className="px-4 py-3 text-xs font-bold text-primary/70">{inc.incident?.priority || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={inc.incident?.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={inc.triage_result} /></td>
                  <td className="px-4 py-3 text-xs text-muted/60 font-medium">{inc.event_count ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted/60">{inc.affected_hosts?.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </div>
  );
}

function safeFormat(ts: string | undefined): string {
  if (!ts) return "—";
  try { return format(new Date(ts), "MMM d HH:mm"); }
  catch { return ts; }
}
