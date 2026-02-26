"use client";

import {
  Bot,
  Wrench,
  Search,
  Database,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";

const AGENT_TOOLS = [
  { name: "Correlated Events", type: "ES|QL", desc: "Timeline by source IP", icon: Database },
  { name: "Lateral Movement", type: "ES|QL", desc: "Multi-host auth detection", icon: Database },
  { name: "Beaconing Detection", type: "ES|QL", desc: "C2 beacon pattern analysis", icon: Database },
  { name: "Process Chain", type: "ES|QL", desc: "Parent-child process trees", icon: Database },
  { name: "Threat Intel Lookup", type: "Search", desc: "IOC + MITRE matching", icon: Search },
  { name: "Incident Response", type: "Workflow", desc: "Automated triage workflow", icon: Zap },
];

const STEPS = ["Correlate", "Enrich", "Detect", "Forensic", "Score", "Report"];

export default function AgentBuilderPanel() {
  return (
    <div className="relative bg-base-dark/40 border border-divider overflow-hidden">
      {/* Top accent */}
      <div className="h-[3px] w-full bg-accent-orange" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-base" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg uppercase tracking-[-0.02em] text-primary">
                  Elastic Agent Builder
                </h3>
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-green-700 bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-[12px] text-muted/70 mt-0.5 tracking-[0.02em]">
                DCO Triage Agent — autonomous threat analysis &amp; response
              </p>
            </div>
          </div>

          <a
            href="/chat"
            className="btn-brutalist inline-flex items-center gap-2 self-start"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Chat with Agent
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </a>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {AGENT_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="border border-divider p-3 hover:border-primary/30 hover:shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 bg-base/50"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-accent-red/60" />
                  <span className="text-[9px] font-bold text-accent-red/70 uppercase tracking-[0.15em]">
                    {tool.type}
                  </span>
                </div>
                <div className="text-[12px] text-primary font-bold uppercase tracking-[0.05em]">
                  {tool.name}
                </div>
                <div className="text-[10px] text-muted/60 mt-1 leading-relaxed">
                  {tool.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reasoning chain */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-muted/50 uppercase tracking-[0.12em]">
          <Wrench className="w-3 h-3" />
          <span className="font-bold">6-step chain:</span>
          {STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className="text-primary/60">{step}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-muted/30" />}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-divider flex items-center gap-4 text-[10px] text-muted/40 uppercase tracking-[0.12em]">
          <span>Powered by Kibana Agent Builder API</span>
          <a
            href={process.env.NEXT_PUBLIC_KIBANA_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-accent-red transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Kibana
          </a>
        </div>
      </div>
    </div>
  );
}
