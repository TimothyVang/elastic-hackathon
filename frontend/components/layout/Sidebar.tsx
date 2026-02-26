"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  ShieldAlert,
  Crosshair,
  Brain,
  FileText,
  Activity,
  MessageSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/hunt", label: "Threat Hunt", icon: Crosshair },
  { href: "/intel", label: "Threat Intel", icon: Brain },
  { href: "/incidents", label: "Incidents", icon: FileText },
  { href: "/chat", label: "Agent Chat", icon: MessageSquare },
];

type ConnectionStatus = "connected" | "error" | "checking";

export default function Sidebar() {
  const pathname = usePathname();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("checking");
  const [clusterName, setClusterName] = useState<string>("");

  useEffect(() => {
    const checkHealth = () => {
      fetch("/api/health")
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "ok") {
            setConnStatus("connected");
            setClusterName(d.cluster || "");
          } else {
            setConnStatus("error");
          }
        })
        .catch(() => setConnStatus("error"));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-surface-raised border-r border-border-subtle flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border-subtle">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          <div>
            <div className="text-sm font-bold text-white leading-tight">
              DCO Triage
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              Threat Dashboard
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-500/15 text-blue-400 font-medium"
                  : "text-gray-400 hover:bg-surface-overlay hover:text-gray-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer with connection status */}
      <div className="px-4 py-3 border-t border-border-subtle space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={clsx("w-2 h-2 rounded-full shrink-0", {
              "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]":
                connStatus === "connected",
              "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]":
                connStatus === "error",
              "bg-yellow-400 animate-pulse": connStatus === "checking",
            })}
          />
          <span className="text-[10px] text-gray-500 truncate">
            {connStatus === "connected"
              ? clusterName || "Elasticsearch"
              : connStatus === "error"
                ? "ES disconnected"
                : "Connecting..."}
          </span>
        </div>
        <div className="text-[10px] text-gray-600">
          Elastic Hackathon 2026
        </div>
      </div>
    </aside>
  );
}
