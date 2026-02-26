"use client";

import { useState } from "react";
import CorrelatedTimeline from "@/components/hunt/CorrelatedTimeline";
import { TableSkeleton } from "@/components/ui/Skeleton";
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
    setLoading(true);
    setError(null);
    setSearched(true);

    fetch(`/api/hunt/correlate?source_ip=${encodeURIComponent(ip.trim())}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const rows = esqlToRows(d.columns, d.values);
        setEvents(rows as unknown as CorrelatedEvent[]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Correlated Events by IP
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Build a chronological timeline of all events from a source IP
        </p>
      </div>

      {/* Search Form */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Source IP (e.g., 10.10.15.42)"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="bg-surface-raised border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-72 font-mono"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && <TableSkeleton rows={6} />}

      {searched && !loading && (
        <p className="text-sm text-gray-500">
          {events.length} events found for {ip}
        </p>
      )}

      {!loading && <CorrelatedTimeline events={events} />}
    </div>
  );
}
