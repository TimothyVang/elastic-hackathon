"use client";

import Link from "next/link";
import { Network, Radio, ArrowRightLeft, GitBranch } from "lucide-react";

const TOOLS = [
  {
    href: "/hunt/correlate",
    label: "Correlated Events by IP",
    description: "Build a timeline of all security events from a suspicious IP within 24 hours.",
    icon: Network,
    accent: "#DB4A2B",
  },
  {
    href: "/hunt/beaconing",
    label: "Beaconing Detection",
    description: "Identify C2 beaconing patterns — outbound connections with regular intervals.",
    icon: Radio,
    accent: "#F8A348",
  },
  {
    href: "/hunt/lateral",
    label: "Lateral Movement",
    description: "Detect credential abuse — same user/IP authenticating to multiple hosts.",
    icon: ArrowRightLeft,
    accent: "#FF89A9",
  },
  {
    href: "/hunt/process",
    label: "Process Chain Analysis",
    description: "Analyze parent-child process trees on a host (e.g., EXCEL → cmd → powershell).",
    icon: GitBranch,
    accent: "#1E1E1E",
  },
];

export default function HuntPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary">
          Threat<br />
          <span className="text-accent-red ml-[5vw]">Hunt</span>
        </h1>
        <p className="text-sm text-muted/60 mt-3">
          ES|QL-powered hunting tools — same tools used by the DCO Triage Agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group border border-divider p-6 transition-all duration-200 hover:shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] bg-base-dark/30 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: tool.accent }} />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: tool.accent + "15" }}>
                <tool.icon className="w-5 h-5" style={{ color: tool.accent }} />
              </div>
              <div>
                <h3 className="font-bold text-primary text-sm uppercase tracking-[0.05em] group-hover:text-accent-red transition-colors">
                  {tool.label}
                </h3>
                <p className="text-xs text-muted/60 mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
