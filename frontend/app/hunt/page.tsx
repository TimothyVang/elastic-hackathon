"use client";

import Link from "next/link";
import {
  Network,
  Radio,
  ArrowRightLeft,
  GitBranch,
} from "lucide-react";

const TOOLS = [
  {
    href: "/hunt/correlate",
    label: "Correlated Events by IP",
    description:
      "Build a timeline of all security events from a suspicious IP within 24 hours.",
    icon: Network,
    color: "blue",
  },
  {
    href: "/hunt/beaconing",
    label: "Beaconing Detection",
    description:
      "Identify C2 beaconing patterns — outbound connections with regular intervals.",
    icon: Radio,
    color: "orange",
  },
  {
    href: "/hunt/lateral",
    label: "Lateral Movement",
    description:
      "Detect credential abuse — same user/IP authenticating to multiple hosts.",
    icon: ArrowRightLeft,
    color: "red",
  },
  {
    href: "/hunt/process",
    label: "Process Chain Analysis",
    description:
      "Analyze parent-child process trees on a host (e.g., EXCEL → cmd → powershell).",
    icon: GitBranch,
    color: "purple",
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
};

export default function HuntPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Threat Hunt Tools</h1>
        <p className="text-sm text-gray-500 mt-1">
          ES|QL-powered hunting tools from the DCO Triage Agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`border rounded-xl p-6 transition-all ${COLOR_MAP[tool.color]}`}
          >
            <div className="flex items-start gap-4">
              <tool.icon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {tool.label}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
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
