"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EventTimeline from "@/components/dashboard/EventTimeline";
import SeverityDonut from "@/components/dashboard/SeverityDonut";
import KillChainTimeline from "@/components/dashboard/KillChainTimeline";
import AgentBuilderPanel from "@/components/dashboard/AgentBuilderPanel";
import ArchitectureDiagram from "@/components/dashboard/ArchitectureDiagram";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { DashboardStats, SecurityAlert } from "@/lib/types";

const REFRESH_INTERVAL = 30;

interface KillChainStage {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  count: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [killChain, setKillChain] = useState<KillChainStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, kcRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/killchain"),
      ]);
      if (!dashRes.ok) throw new Error(`HTTP ${dashRes.status}`);
      const dashData = await dashRes.json();
      setData(dashData);

      if (kcRes.ok) {
        const kcData = await kcRes.json();
        setKillChain(kcData.stages || []);
      }

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refreshTimer = setInterval(() => {
      fetchData();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
    return () => clearInterval(refreshTimer);
  }, [fetchData]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const manualRefresh = () => {
    setCountdown(REFRESH_INTERVAL);
    fetchData();
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="font-display font-bold text-[clamp(2.5rem,8vw,6rem)] uppercase tracking-[-0.05em] leading-[0.8] text-primary">
            Threat
            <br />
            <span className="ml-[10vw] text-accent-red">Command</span>
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-base-dark/40 border border-divider animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-accent-red/10 border-l-4 border-accent-red p-6 mt-8">
        <p className="font-display font-bold uppercase tracking-wide text-accent-red">
          System Failure
        </p>
        <p className="text-sm mt-2 text-muted">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-16">
      {/* Hero header with blobs */}
      <div className="relative animate-slide-up">
        {/* Gradient blobs */}
        <div
          className="absolute -top-20 -left-20 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full animate-blob-pulse pointer-events-none"
          style={{
            background: "#DB4A2B",
            filter: "blur(140px)",
            mixBlendMode: "multiply",
            opacity: 0.15,
          }}
        />
        <div
          className="absolute -top-10 right-0 w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full animate-blob-pulse-alt pointer-events-none"
          style={{
            background: "#F8A348",
            filter: "blur(140px)",
            mixBlendMode: "multiply",
            opacity: 0.12,
          }}
        />

        <div className="relative z-10 flex items-end justify-between">
          <div>
            <h1 className="font-display font-bold text-[clamp(2.5rem,8vw,6rem)] uppercase tracking-[-0.05em] leading-[0.8] text-primary">
              Threat
              <br />
              <span className="ml-[10vw] text-accent-red">Command</span>
            </h1>
            <p className="mt-4 text-muted/60 text-[15px] max-w-[400px] leading-relaxed">
              Real-time security telemetry and autonomous threat triage powered by Elastic Agent Builder.
            </p>
          </div>

          <button
            onClick={manualRefresh}
            className="btn-brutalist flex items-center gap-2 self-end"
          >
            <span className="relative z-10 flex items-center gap-2 text-[12px]">
              <RefreshCw className="w-3.5 h-3.5 group-hover:animate-spin" />
              <span className="tabular-nums w-4 text-right">{countdown}</span>s
            </span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up-d1">
        <StatCard
          label="Total Alerts"
          value={data.totalAlerts}
          icon={ShieldAlert}
          color="blue"
          subtext="Last 24 hours"
        />
        <StatCard
          label="Critical Threats"
          value={data.criticalCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="High Severity"
          value={data.highCount}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          label="Medium / Low"
          value={data.mediumCount + data.lowCount}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Agent Builder Panel */}
      <div className="animate-slide-up-d2">
        <AgentBuilderPanel />
      </div>

      {/* Architecture Diagram */}
      <div className="animate-slide-up-d3">
        <ArchitectureDiagram />
      </div>

      {/* Kill Chain */}
      {killChain.length > 0 && (
        <div className="animate-slide-up-d4">
          <KillChainTimeline stages={killChain} />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up-d5">
        <SeverityDonut data={data.severityCounts} />
        <EventTimeline data={data.eventsByHour} />
      </div>

      {/* Recent Alerts */}
      <div className="animate-slide-up-d6">
        {/* Category divider — massive type */}
        <h2 className="font-display font-bold text-[clamp(1.5rem,4vw,3rem)] uppercase tracking-[-0.04em] leading-[0.85] text-primary/10 mb-6">
          Recent Alerts
        </h2>

        <div className="space-y-2">
          {data.recentAlerts.map((alert: SecurityAlert, i: number) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border border-divider bg-base-dark/30 hover:shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary group-hover:text-accent-red transition-colors truncate">
                  {alert.message || "No description"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <SeverityBadge severity={alert.alert?.severity} />
                  <MitreBadge
                    techniqueId={alert.threat?.technique?.id}
                    techniqueName={alert.threat?.technique?.name}
                  />
                  {alert.host?.name && (
                    <span className="text-[10px] font-bold text-muted/50 bg-primary/5 border border-divider px-2 py-0.5 uppercase tracking-[0.1em]">
                      {alert.host.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted/40 shrink-0 mt-1 tracking-[0.08em]">
                {alert["@timestamp"]
                  ? new Date(alert["@timestamp"]).toLocaleTimeString()
                  : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
