"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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
          <h1 className="text-2xl font-bold text-white tracking-wide">Threat Command Center</h1>
          <p className="text-sm font-mono text-cyber-cyan mt-1 uppercase tracking-widest opacity-80">
            System Initializing...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <AlertListSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-2xl p-6 text-cyber-red backdrop-blur-glass shadow-neon-red">
        <p className="font-bold tracking-widest uppercase font-mono">System Failure</p>
        <p className="text-sm mt-2 opacity-80 font-mono">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">Threat Command Center</h1>
          <p className="text-xs font-mono text-cyber-cyan mt-1.5 uppercase tracking-widest opacity-80">
            Live telemetry / Последние 24 часа
          </p>
        </div>
        <button
          onClick={manualRefresh}
          className="flex items-center gap-2 text-xs font-mono text-cyber-cyan hover:text-white transition-all bg-cyber-cyan/10 hover:bg-cyber-cyan/20 hover:shadow-neon-cyan border border-cyber-cyan/30 rounded-xl px-4 py-2 group"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:animate-spin" />
          <span className="tabular-nums w-4 text-right">{countdown}</span>s
        </button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          label="Med / Low"
          value={`${data.mediumCount} / ${data.lowCount}`}
          icon={CheckCircle}
          color="yellow"
        />
      </motion.div>

      {/* Kill Chain Visualization */}
      {killChain.length > 0 && (
        <motion.div variants={itemVariants}>
          <KillChainTimeline stages={killChain} />
        </motion.div>
      )}

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityDonut data={data.severityCounts} />
        <EventTimeline data={data.eventsByHour} />
      </motion.div>

      {/* Recent Alerts */}
      <motion.div
        variants={itemVariants}
        className="bg-surface-overlay/30 backdrop-blur-glass border border-border-subtle rounded-2xl p-6 relative overflow-hidden group hover:border-cyber-red/30 transition-colors duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <h3 className="text-sm font-mono tracking-widest text-cyber-red uppercase mb-6 relative z-10 drop-shadow-[0_0_8px_rgba(255,0,60,0.5)]">
          Recent High-Severity Alerts
        </h3>
        <div className="space-y-3 relative z-10">
          {data.recentAlerts.map((alert: SecurityAlert, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyber-red/30 hover:shadow-[0_0_15px_rgba(255,0,60,0.15)] transition-all duration-300 group/item"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate group-hover/item:text-white transition-colors">
                  {alert.message || "No description"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <SeverityBadge severity={alert.alert?.severity} />
                  <MitreBadge
                    techniqueId={alert.threat?.technique?.id}
                    techniqueName={alert.threat?.technique?.name}
                  />
                  {alert.host?.name && (
                    <span className="text-[10px] font-mono tracking-wider text-gray-400 bg-surface/80 border border-border-subtle px-2 py-1 rounded-md shadow-sm">
                      {alert.host.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyber-cyan/70 shrink-0 mt-1">
                {alert["@timestamp"]
                  ? new Date(alert["@timestamp"]).toLocaleTimeString()
                  : ""}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
