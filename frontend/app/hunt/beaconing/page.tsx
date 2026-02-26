"use client";

import { useEffect, useState } from "react";
import BeaconingTable from "@/components/hunt/BeaconingTable";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { esqlToRows } from "@/lib/utils";
import type { BeaconingResult } from "@/lib/types";

export default function BeaconingPage() {
  const [data, setData] = useState<BeaconingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hunt/beaconing")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const rows = esqlToRows(d.columns, d.values);
        setData(rows as unknown as BeaconingResult[]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Beaconing Detection</h1>
        <p className="text-sm text-gray-500 mt-1">
          Outbound connections with regular intervals — potential C2 beacons
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {data.length} beacon pattern{data.length !== 1 ? "s" : ""} detected
          </p>
          <BeaconingTable data={data} />
        </>
      )}
    </div>
  );
}
