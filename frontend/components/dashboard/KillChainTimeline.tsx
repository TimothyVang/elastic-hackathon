"use client";

import { clsx } from "clsx";
import {
  Mail,
  Terminal,
  Radio,
  KeyRound,
  Network,
  FolderArchive,
  Upload,
  Shield,
} from "lucide-react";

interface KillChainStage {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  count: number;
}

interface KillChainTimelineProps {
  stages: KillChainStage[];
  onStageClick?: (tactic: string, color: string) => void;
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

type TacticConfig = { color: string; icon: typeof Shield };

const TACTIC_CONFIG: Record<string, TacticConfig> = {
  "Initial Access":      { color: "#3b82f6", icon: Mail },
  "Execution":           { color: "#DB4A2B", icon: Terminal },
  "Command and Control": { color: "#F8A348", icon: Radio },
  "Credential Access":   { color: "#ef4444", icon: KeyRound },
  "Lateral Movement":    { color: "#FF89A9", icon: Network },
  "Collection":          { color: "#a855f7", icon: FolderArchive },
  "Exfiltration":        { color: "#DB4A2B", icon: Upload },
};

const DEFAULT_CONFIG: TacticConfig = { color: "#444444", icon: Shield };

export default function KillChainTimeline({ stages, onStageClick }: KillChainTimelineProps) {
  if (!stages.length) return null;

  const sorted = [...stages].sort((a, b) => {
    const ai = TACTIC_ORDER.indexOf(a.tactic);
    const bi = TACTIC_ORDER.indexOf(b.tactic);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const total = sorted.reduce((s, st) => s + st.count, 0);

  return (
    <div className="relative">
      {/* Section label — massive brutalist type */}
      <h2 className="font-display font-bold text-[clamp(2rem,6vw,5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary/90 mb-8">
        Kill Chain
      </h2>

      {/* Flow */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-4">
        {sorted.map((stage, i) => {
          const config = TACTIC_CONFIG[stage.tactic] || DEFAULT_CONFIG;
          const Icon = config.icon;
          const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;

          return (
            <div key={stage.tactic} className="flex items-stretch shrink-0">
              {/* Stage card */}
              <div
                className={`relative min-w-[175px] bg-base-dark/60 border border-divider transition-all duration-300 hover:shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] group/card ${onStageClick ? "cursor-pointer" : ""}`}
                role={onStageClick ? "button" : undefined}
                tabIndex={onStageClick ? 0 : undefined}
                onClick={() => onStageClick?.(stage.tactic, config.color)}
                onKeyDown={(e) => { if (onStageClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onStageClick(stage.tactic, config.color); } }}
              >
                {/* Top accent */}
                <div
                  className="h-[4px] w-full"
                  style={{ backgroundColor: config.color }}
                />

                <div className="p-4 pt-3">
                  {/* Step + Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-[11px] font-display font-bold text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {i + 1}
                    </div>
                    <Icon
                      className="w-4 h-4 opacity-30 group-hover/card:opacity-70 transition-opacity"
                      style={{ color: config.color }}
                    />
                  </div>

                  {/* Tactic name */}
                  <div
                    className="text-[13px] font-bold uppercase tracking-[0.05em] leading-tight"
                    style={{ color: config.color }}
                  >
                    {stage.tactic}
                  </div>

                  {/* Technique */}
                  <div className="text-[10px] text-muted/60 font-medium tracking-[0.1em] mt-2 uppercase">
                    {stage.techniqueId}
                  </div>
                  <div className="text-[11px] text-muted/80 mt-0.5 leading-tight">
                    {stage.techniqueName}
                  </div>

                  {/* Count */}
                  <div className="mt-4 flex items-end justify-between border-t border-divider pt-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-display font-bold tracking-[-0.02em]"
                        style={{ color: config.color }}
                      >
                        {stage.count}
                      </span>
                      <span className="text-[10px] text-muted/50 uppercase tracking-[0.1em]">
                        events
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: config.color, opacity: 0.5 }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < sorted.length - 1 && (
                <div className="flex items-center px-1 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <line
                      x1="0" y1="10" x2="12" y2="10"
                      stroke="#1E1E1E"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.2"
                      style={{ animation: "dash-flow 1s linear infinite" }}
                    />
                    <polygon
                      points="12,6 20,10 12,14"
                      fill="#1E1E1E"
                      opacity="0.2"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="mt-4 flex items-center gap-4 text-[11px] text-muted/50 uppercase tracking-[0.12em]">
        <span>{sorted.length} tactics detected</span>
        <span className="w-px h-3 bg-divider" />
        <span>{total} total events</span>
        <span className="w-px h-3 bg-divider" />
        <span>MITRE ATT&CK mapped</span>
      </div>
    </div>
  );
}
