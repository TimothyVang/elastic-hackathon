"use client";

import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { ProcessChainEvent } from "@/lib/types";

export default function ProcessTree({
  events,
}: {
  events: ProcessChainEvent[];
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No process events found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((evt, i) => {
        const indent = evt["process.parent.name"] ? 1 : 0;
        return (
          <div
            key={i}
            className="bg-surface-raised border border-border-subtle rounded-lg p-4"
            style={{ marginLeft: `${indent * 24}px` }}
          >
            <div className="flex items-start gap-3">
              {/* Process chain indicator */}
              <div className="shrink-0 mt-0.5">
                {evt["process.parent.name"] && (
                  <span className="text-gray-600 text-xs font-mono">
                    {evt["process.parent.name"]} ({evt["process.parent.pid"]}) →
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-blue-400 font-medium">
                    {evt["process.name"]}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">
                    PID {evt["process.pid"]}
                  </span>
                  <SeverityBadge severity={evt["alert.severity"]} />
                  <MitreBadge techniqueId={evt["threat.technique.id"]} />
                </div>
                {evt["process.command_line"] && (
                  <pre className="text-xs text-gray-400 bg-surface/50 rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap break-all">
                    {evt["process.command_line"]}
                  </pre>
                )}
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>{safeFormat(evt["@timestamp"])}</span>
                  {evt["user.name"] && <span>User: {evt["user.name"]}</span>}
                  {evt["event.action"] && <span>{evt["event.action"]}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
