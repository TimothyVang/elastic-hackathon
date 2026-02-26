"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
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
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-surface-overlay backdrop-blur-glass border border-border-subtle rounded-2xl flex flex-col z-30 shadow-glass overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border-subtle/50 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyber-cyan/10 blur-xl pointer-events-none" />

        <Link href="/dashboard" className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <Activity className="w-8 h-8 text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            <div className="absolute inset-0 bg-cyber-cyan/20 blur-md rounded-full animate-pulse-glow" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-wide">
              SYSTEM<span className="text-cyber-cyan">.OS</span>
            </div>
            <div className="text-[10px] text-cyber-cyan uppercase tracking-[0.2em] font-mono">
              Threat Triage
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 group hover:-translate-y-0.5",
                isActive
                  ? "text-white font-medium"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-transparent border-l-2 border-cyber-cyan rounded-xl shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {/* Hover background for non-active */}
              {!isActive && (
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-xl transition-colors" />
              )}

              <Icon className={clsx(
                "w-5 h-5 shrink-0 transition-colors relative z-10",
                isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" : "group-hover:text-cyber-cyan"
              )} />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer with connection status */}
      <div className="px-6 py-5 border-t border-border-subtle/50 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <div
              className={clsx("absolute inset-0 rounded-full blur-sm", {
                "bg-cyber-cyan": connStatus === "connected",
                "bg-cyber-red": connStatus === "error",
                "bg-cyber-gold": connStatus === "checking",
              })}
            />
            <div
              className={clsx("relative w-2 h-2 rounded-full", {
                "bg-cyber-cyan": connStatus === "connected",
                "bg-cyber-red": connStatus === "error",
                "bg-cyber-gold animate-pulse": connStatus === "checking",
              })}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-gray-300 tracking-wider">
              {connStatus === "connected"
                ? clusterName || "SYSTEM ONLINE"
                : connStatus === "error"
                  ? "SYS OFFLINE"
                  : "CONNECTING..."}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
