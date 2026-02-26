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
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import {
  StatCardSkeleton,
  ChartSkeleton,
  AlertListSkeleton,
} from "@/components/ui/Skeleton";
import type { DashboardStats, SecurityAlert } from "@/lib/types";

const REFRESH_INTERVAL = 30; // seconds

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

  // Initial load + auto-refresh
  useEffect(() => {
    fetchData();

    const refreshTimer = setInterval(() => {
      fetchData();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);

    return () => clearInterval(refreshTimer);
  }, [fetchData]);

  // Countdown ticker
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
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Security Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of security alerts from the last 24 hours
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <AlertListSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1 text-red-400/70">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Security Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of security alerts from the last 24 hours
          </p>
        </div>
        <button
          onClick={manualRefresh}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors bg-surface-raised border border-border-subtle rounded-lg px-3 py-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="font-mono tabular-nums w-4 text-right">{countdown}</span>s
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Alerts"
          value={data.totalAlerts}
          icon={ShieldAlert}
          color="blue"
          subtext="Last 24 hours"
        />
        <StatCard
          label="Critical"
          value={data.criticalCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="High"
          value={data.highCount}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          label="Medium / Low"
          value={`${data.mediumCount} / ${data.lowCount}`}
          icon={CheckCircle}
          color="yellow"
        />
      </div>

      {/* Kill Chain Visualization */}
      {killChain.length > 0 && <KillChainTimeline stages={killChain} />}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SeverityDonut data={data.severityCounts} />
        <EventTimeline data={data.eventsByHour} />
      </div>

      {/* Recent Alerts */}
      <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">
          Recent High-Severity Alerts
        </h3>
        <div className="space-y-2">
          {data.recentAlerts.map((alert: SecurityAlert, i: number) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-surface-overlay/40 hover:bg-surface-overlay transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">
                  {alert.message || "No description"}
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <SeverityBadge severity={alert.alert?.severity} />
                  <MitreBadge
                    techniqueId={alert.threat?.technique?.id}
                    techniqueName={alert.threat?.technique?.name}
                  />
                  {alert.host?.name && (
                    <span className="text-xs text-gray-500">
                      {alert.host.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 shrink-0">
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
