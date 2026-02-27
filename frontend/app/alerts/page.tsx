"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import AlertDrawer from "@/components/ui/AlertDrawer";
import type { SecurityAlert } from "@/lib/types";

const SEVERITY_OPTIONS = ["", "critical", "high", "medium", "low"];
const CATEGORY_OPTIONS = ["", "network", "process", "authentication", "email", "file"];

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
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setAlerts(d.alerts); setTotal(d.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [severity, category, search]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary">
          Alerts
        </h1>
        <p className="text-sm text-muted/60 mt-2">
          {total} alerts in the security-alerts index
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40 uppercase tracking-wider text-[12px] font-medium">
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40 uppercase tracking-wider text-[12px] font-medium">
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input type="text" placeholder="Search alerts..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchAlerts()}
          className="bg-base-dark/40 border border-divider px-3 py-2.5 text-sm text-primary placeholder-muted/30 focus:outline-none focus:border-primary/40 w-64" />
      </div>

      {error && (
        <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted/50 text-sm uppercase tracking-wider">Loading alerts...</div>
      ) : (
        <div className="overflow-x-auto border border-divider">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-base-dark/40 border-b-2 border-primary/10">
                {["Time", "Severity", "Message", "Category", "Source IP", "Host", "MITRE"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted/50 uppercase tracking-[0.15em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {alerts.map((a, i) => (
                <tr key={i} onClick={() => setSelectedAlert(a)}
                  className="hover:bg-base-dark/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-xs text-muted/60 whitespace-nowrap">{safeFormat(a["@timestamp"])}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={a.alert?.severity} eventSeverity={a.event?.severity} /></td>
                  <td className="px-4 py-3 text-primary/80 max-w-sm truncate">{a.message || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted/60">{a.event?.category || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted/60 font-medium">{a.source?.ip || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted/60">{a.host?.name || "—"}</td>
                  <td className="px-4 py-3"><MitreBadge techniqueId={a.threat?.technique?.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDrawer alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}

function safeFormat(ts: string | undefined): string {
  if (!ts) return "—";
  try { return format(new Date(ts), "HH:mm:ss MMM d"); }
  catch { return ts; }
}
