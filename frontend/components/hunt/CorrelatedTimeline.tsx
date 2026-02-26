"use client";

import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { CorrelatedEvent } from "@/lib/types";

export default function CorrelatedTimeline({
  events,
}: {
  events: CorrelatedEvent[];
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted/50">
        No correlated events found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((evt, i) => (
        <div
          key={i}
          className="bg-base-dark/30 border border-divider p-4 flex gap-4"
        >
          {/* Timestamp column */}
          <div className="shrink-0 w-36 text-xs text-muted/60 font-medium pt-0.5">
            {safeFormat(evt["@timestamp"])}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary/80 mb-2">{evt.message || "—"}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <SeverityBadge severity={evt["alert.severity"]} />
              <MitreBadge
                techniqueId={evt["threat.technique.id"]}
                techniqueName={evt["threat.technique.name"]}
              />
              {evt["host.name"] && (
                <span className="text-gray-500">
                  Host: <span className="text-gray-400">{evt["host.name"]}</span>
                </span>
              )}
              {evt["user.name"] && (
                <span className="text-gray-500">
                  User: <span className="text-gray-400">{evt["user.name"]}</span>
                </span>
              )}
              {evt["process.name"] && (
                <span className="text-gray-500">
                  Process:{" "}
                  <span className="text-gray-400 font-mono">
                    {evt["process.name"]}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
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
