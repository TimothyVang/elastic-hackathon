"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Wrench,
  Search,
  Database,
  ExternalLink,
  ChevronRight,
  Zap,
  Shield,
  GitBranch,
  RefreshCw,
} from "lucide-react";

interface AgentStatus {
  connected: boolean;
  agent?: {
    id: string;
    name: string;
    description: string;
    tool_count: number;
  };
  tools?: Array<{
    id: string;
    type: string;
    description: string;
  }>;
  error?: string;
}

const FALLBACK_TOOLS = [
  { name: "Correlated Events", type: "ES|QL", desc: "Timeline by source IP", icon: Database },
  { name: "Lateral Movement", type: "ES|QL", desc: "Multi-host auth detection", icon: Database },
  { name: "Beaconing Detection", type: "ES|QL", desc: "C2 beacon pattern analysis", icon: Database },
  { name: "Process Chain", type: "ES|QL", desc: "Parent-child process trees", icon: Database },
  { name: "Privilege Escalation", type: "ES|QL", desc: "High-severity event clusters", icon: Shield },
  { name: "Threat Intel Lookup", type: "Search", desc: "IOC + MITRE matching", icon: Search },
  { name: "Incident Workflow", type: "Workflow", desc: "Automated triage workflow", icon: GitBranch },
];

const STEPS = ["Correlate", "Enrich", "Detect", "Forensic", "Score", "Report"];

function getToolIcon(type: string) {
  switch (type) {
    case "esql": return Database;
    case "index_search": return Search;
    case "workflow": return GitBranch;
    default: return Zap;
  }
}

function formatToolType(type: string) {
  switch (type) {
    case "esql": return "ES|QL";
    case "index_search": return "Search";
    case "workflow": return "Workflow";
    default: return type;
  }
}

export default function AgentBuilderPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent-builder/status");
      const data = await res.json();
      setStatus(data);
      setLastChecked(new Date());
    } catch {
      setStatus({ connected: false, error: "Failed to fetch status" });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isConnected = status?.connected === true;
  const liveTools = status?.tools || [];
  const toolCount = isConnected ? (liveTools.length || status?.agent?.tool_count || FALLBACK_TOOLS.length) : FALLBACK_TOOLS.length;

  return (
    <div className="relative bg-base-dark/40 border border-divider overflow-hidden">
      {/* Top accent */}
      <div className={`h-[3px] w-full ${isConnected ? "bg-green-500" : "bg-accent-orange"}`} />

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
                {loading ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted/50 bg-muted/5 border border-muted/10 px-2 py-0.5">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Checking
                  </span>
                ) : isConnected ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-green-700 bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted/70 mt-0.5 tracking-[0.02em]">
                DCO Triage Agent — {toolCount} tools for autonomous threat analysis &amp; response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 border border-divider text-muted/40 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <a
              href="/chat"
              className="btn-brutalist inline-flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Chat with Agent
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>
        </div>

        {/* Tools grid — live from API or fallback */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {isConnected && liveTools.length > 0
            ? liveTools.map((tool) => {
                const Icon = getToolIcon(tool.type);
                return (
                  <div
                    key={tool.id}
                    className="border border-divider p-3 hover:border-primary/30 hover:shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 bg-base/50"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className="w-3.5 h-3.5 text-accent-red/60" />
                      <span className="text-[9px] font-bold text-accent-red/70 uppercase tracking-[0.15em]">
                        {formatToolType(tool.type)}
                      </span>
                    </div>
                    <div className="text-[11px] text-primary font-bold uppercase tracking-[0.05em] leading-tight">
                      {tool.id.replace(/_/g, " ")}
                    </div>
                    <div className="text-[9px] text-muted/60 mt-1 leading-relaxed line-clamp-2">
                      {tool.description}
                    </div>
                  </div>
                );
              })
            : FALLBACK_TOOLS.map((tool) => {
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
                    <div className="text-[11px] text-primary font-bold uppercase tracking-[0.05em] leading-tight">
                      {tool.name}
                    </div>
                    <div className="text-[9px] text-muted/60 mt-1 leading-relaxed">
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
          <span>
            {isConnected
              ? `Connected to Kibana — ${toolCount} tools active`
              : "Powered by Kibana Agent Builder API"}
          </span>
          {lastChecked && (
            <span className="text-muted/25">
              Checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
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
