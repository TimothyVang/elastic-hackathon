"use client";

import { useEffect, useState, useCallback } from "react";
import IOCTable from "@/components/intel/IOCTable";
import type { ThreatIntel } from "@/lib/types";

export default function IntelPage() {
  const [iocs, setIocs] = useState<ThreatIntel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);

    fetch(`/api/intel?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setIocs(d.iocs); setTotal(d.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary">
          Threat<br />
          <span className="text-accent-orange ml-[5vw]">Intel</span>
        </h1>
        <p className="text-sm text-muted/60 mt-3">
          {total} IOCs in the threat-intel index — MITRE ATT&CK mapped
        </p>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Search IOCs (IP, domain, hash, technique...)"
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          className="bg-base-dark/40 border border-divider px-4 py-2.5 text-sm text-primary placeholder-muted/30 focus:outline-none focus:border-primary/40 w-96" />
        <button onClick={fetchData} disabled={loading}
          className="btn-brutalist disabled:opacity-30">
          <span className="relative z-10 text-[12px]">{loading ? "Searching..." : "Search"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted/50 text-sm uppercase tracking-wider">Loading threat intelligence...</div>
      ) : (
        <IOCTable data={iocs} />
      )}
    </div>
  );
}
