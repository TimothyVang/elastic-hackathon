"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Shield, Bot, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/hunt", label: "Hunt" },
  { href: "/intel", label: "Intel" },
  { href: "/incidents", label: "Incidents" },
  { href: "/chat", label: "Agent" },
];

type ConnectionStatus = "connected" | "error" | "checking";

export default function TopNav() {
  const pathname = usePathname();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("checking");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkHealth = () => {
      fetch("/api/health")
        .then((r) => r.json())
        .then((d) => setConnStatus(d.status === "ok" ? "connected" : "error"))
        .catch(() => setConnStatus("error"));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base/90 backdrop-blur-md border-b border-divider">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/dashboard"
          className="font-display font-bold text-2xl uppercase tracking-[-0.03em] text-primary flex items-center gap-2"
        >
          <Shield className="w-5 h-5 text-accent-red" />
          DCO
        </Link>

        {/* Center: Links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "text-[13px] font-medium tracking-[0.1em] uppercase transition-colors duration-200",
                  isActive
                    ? "text-accent-red"
                    : "text-primary/40 hover:text-primary"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: Agent status + mobile toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] uppercase text-primary/40">
            <Bot className="w-4 h-4" />
            <span>Elastic Agent</span>
            <div
              className={clsx("w-2 h-2 rounded-full", {
                "bg-green-500 animate-pulse": connStatus === "connected",
                "bg-red-500": connStatus === "error",
                "bg-amber-400 animate-pulse": connStatus === "checking",
              })}
            />
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1 text-primary/60"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-divider bg-base/95 backdrop-blur-md px-6 py-4 space-y-2">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "block py-2 text-sm font-medium tracking-[0.08em] uppercase",
                  isActive ? "text-accent-red" : "text-primary/50"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
