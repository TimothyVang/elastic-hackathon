"use client";

import { useState } from "react";
import CorrelatedTimeline from "@/components/hunt/CorrelatedTimeline";
import { esqlToRows } from "@/lib/utils";
import type { CorrelatedEvent } from "@/lib/types";

export default function CorrelatePage() {
  const [ip, setIp] = useState("10.10.15.42");
  const [events, setEvents] = useState<CorrelatedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!ip.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    fetch(`/api/hunt/correlate?source_ip=${encodeURIComponent(ip.trim())}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setEvents(esqlToRows(d.columns, d.values) as unknown as CorrelatedEvent[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.5rem)] uppercase tracking-[-0.04em] leading-[0.85] text-primary">
          Correlated Events
        </h1>
        <p className="text-sm text-muted/60 mt-2">Build a chronological timeline of all events from a source IP</p>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Source IP (e.g., 10.10.15.42)" value={ip}
          onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
          className="bg-base-dark/40 border border-divider px-4 py-2.5 text-sm text-primary placeholder-muted/30 focus:outline-none focus:border-primary/40 w-72 font-medium" />
        <button onClick={search} disabled={loading} className="btn-brutalist disabled:opacity-30">
          <span className="relative z-10 text-[12px]">{loading ? "Searching..." : "Search"}</span>
        </button>
      </div>

      {error && <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>}
      {loading && <div className="text-center py-8 text-muted/50 text-sm uppercase tracking-wider">Correlating events...</div>}
      {searched && !loading && <p className="text-sm text-muted/60">{events.length} events found for {ip}</p>}
      {!loading && <CorrelatedTimeline events={events} />}
    </div>
  );
}
