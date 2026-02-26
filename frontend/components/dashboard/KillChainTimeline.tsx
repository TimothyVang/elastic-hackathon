"use client";

import { clsx } from "clsx";

interface KillChainStage {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  count: number;
}

interface KillChainTimelineProps {
  stages: KillChainStage[];
}

const TACTIC_ORDER = [
  "Initial Access",
  "Execution",
  "Command and Control",
  "Credential Access",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
];

const TACTIC_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  "Initial Access": {
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  "Execution": {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  "Command and Control": {
    bg: "bg-orange-500/15",
    border: "border-orange-500/40",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  "Credential Access": {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  "Lateral Movement": {
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-400",
    glow: "shadow-rose-500/20",
  },
  "Collection": {
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  "Exfiltration": {
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/40",
    text: "text-fuchsia-400",
    glow: "shadow-fuchsia-500/20",
  },
};

const DEFAULT_COLOR = {
  bg: "bg-gray-500/15",
  border: "border-gray-500/40",
  text: "text-gray-400",
  glow: "shadow-gray-500/20",
};

export default function KillChainTimeline({ stages }: KillChainTimelineProps) {
  if (!stages.length) return null;

  // Sort stages by MITRE kill chain order
  const sorted = [...stages].sort((a, b) => {
    const ai = TACTIC_ORDER.indexOf(a.tactic);
    const bi = TACTIC_ORDER.indexOf(b.tactic);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-1">
        MITRE ATT&CK Kill Chain
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Attack progression through {sorted.length} tactic{sorted.length !== 1 ? "s" : ""}
      </p>

      {/* Horizontal flow */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {sorted.map((stage, i) => {
          const colors = TACTIC_COLORS[stage.tactic] || DEFAULT_COLOR;
          return (
            <div key={stage.tactic} className="flex items-stretch shrink-0">
              {/* Stage card */}
              <div
                className={clsx(
                  "relative border rounded-lg p-3 min-w-[140px] shadow-lg",
                  colors.bg,
                  colors.border,
                  colors.glow
                )}
              >
                {/* Step number */}
                <div
                  className={clsx(
                    "absolute -top-2.5 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    colors.bg,
                    colors.border,
                    colors.text,
                    "border"
                  )}
                >
                  {i + 1}
                </div>

                <div className="mt-1">
                  <div className={clsx("text-xs font-semibold", colors.text)}>
                    {stage.tactic}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    {stage.techniqueId}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                    {stage.techniqueName}
                  </div>
                  <div className={clsx("text-lg font-bold mt-1.5", colors.text)}>
                    {stage.count}
                    <span className="text-[10px] font-normal text-gray-500 ml-1">
                      events
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < sorted.length - 1 && (
                <div className="flex items-center px-1.5">
                  <div className="w-4 h-px bg-gray-600" />
                  <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-gray-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
