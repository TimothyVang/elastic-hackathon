"use client";

import { useEffect, useState } from "react";
import BeaconingTable from "@/components/hunt/BeaconingTable";
import { esqlToRows } from "@/lib/utils";
import type { BeaconingResult } from "@/lib/types";

export default function BeaconingPage() {
  const [data, setData] = useState<BeaconingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hunt/beaconing")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setData(esqlToRows(d.columns, d.values) as unknown as BeaconingResult[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(1.5rem,4vw,2.5rem)] uppercase tracking-[-0.04em] leading-[0.85] text-primary">
          Beaconing Detection
        </h1>
        <p className="text-sm text-muted/60 mt-2">Outbound connections with regular intervals — potential C2 beacons</p>
      </div>

      {error && <div className="bg-accent-red/8 border-l-4 border-accent-red p-4 text-accent-red text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-8 text-muted/50 text-sm uppercase tracking-wider">Detecting beacons...</div>
      ) : (
        <>
          <p className="text-sm text-muted/60">{data.length} beacon pattern{data.length !== 1 ? "s" : ""} detected</p>
          <BeaconingTable data={data} />
        </>
      )}
    </div>
  );
}
