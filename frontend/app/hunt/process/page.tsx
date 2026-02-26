"use client";

import { useState } from "react";
import ProcessTree from "@/components/hunt/ProcessTree";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { esqlToRows } from "@/lib/utils";
import type { ProcessChainEvent } from "@/lib/types";

export default function ProcessPage() {
  const [hostname, setHostname] = useState("WS-PC0142");
  const [events, setEvents] = useState<ProcessChainEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!hostname.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    fetch(
      `/api/hunt/process?hostname=${encodeURIComponent(hostname.trim())}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const rows = esqlToRows(d.columns, d.values);
        setEvents(rows as unknown as ProcessChainEvent[]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">
          Process Chain Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyze parent-child process relationships on a host
        </p>
      </div>

      {/* Search Form */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Hostname (e.g., WS-PC0142)"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="bg-surface-raised border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-72 font-mono"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze"}
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
          {events.length} process events on {hostname}
        </p>
      )}

      {!loading && <ProcessTree events={events} />}
    </div>
  );
}
