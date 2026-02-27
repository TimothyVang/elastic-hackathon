"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { SecurityAlert } from "@/lib/types";

interface StageSummary {
  firstEvent: string | null;
  lastEvent: string | null;
  maxRiskScore: number;
  hosts: string[];
  users: string[];
  sourceIps: string[];
  destIps: string[];
  techniqueIds: string[];
}

interface KillChainDrawerProps {
  tactic: string;
  tacticColor: string;
  onClose: () => void;
  onEventClick?: (alert: SecurityAlert) => void;
}

function safeFormat(ts: string | undefined | null, fmt: string): string {
  if (!ts) return "—";
  try { return format(new Date(ts), fmt); }
  catch { return ts; }
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Inline forensic sections by event category ─────────────────────

function ProcessDetail({ alert }: { alert: SecurityAlert }) {
  if (!alert.process?.name && !alert.process?.command_line) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {alert.process?.command_line && (
        <div>
          <span className="text-[9px] text-muted/40 uppercase tracking-[0.1em]">Command Line</span>
          <pre className="text-[11px] text-primary/80 bg-base border border-divider p-2 mt-0.5 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
            {alert.process.command_line}
          </pre>
        </div>
      )}
      {(alert.process?.parent?.name || alert.process?.name) && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted/60">
          {alert.process?.parent?.name && (
            <>
              <span className="font-mono text-primary/60">{alert.process.parent.name}</span>
              {alert.process.parent.pid != null && (
                <span className="text-[9px] text-muted/30">({alert.process.parent.pid})</span>
              )}
              <span className="text-muted/30">→</span>
            </>
          )}
          <span className="font-mono text-primary/80">{alert.process?.name}</span>
          {alert.process?.pid != null && (
            <span className="text-[9px] text-muted/30">({alert.process.pid})</span>
          )}
        </div>
      )}
      {alert.process?.executable && (
        <div className="text-[10px] text-muted/40 font-mono truncate">{alert.process.executable}</div>
      )}
      {alert.process?.hash?.sha256 && (
        <div className="text-[10px] text-muted/30 font-mono truncate">SHA256: {alert.process.hash.sha256}</div>
      )}
    </div>
  );
}

function NetworkDetail({ alert }: { alert: SecurityAlert }) {
  if (!alert.source?.ip && !alert.destination?.ip && !alert.network?.protocol) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {(alert.source?.ip || alert.destination?.ip) && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-primary/70">
            {alert.source?.ip || "?"}
            {alert.source?.port ? `:${alert.source.port}` : ""}
          </span>
          <span className="text-muted/30">→</span>
          <span className="text-primary/70">
            {alert.destination?.ip || "?"}
            {alert.destination?.port ? `:${alert.destination.port}` : ""}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {alert.network?.protocol && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-primary/5 border border-divider text-muted/50">
            {alert.network.protocol}
          </span>
        )}
        {alert.network?.direction && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-primary/5 border border-divider text-muted/50">
            {alert.network.direction}
          </span>
        )}
        {(alert.source?.bytes != null || alert.destination?.bytes != null) && (
          <span className="text-[10px] text-muted/40">
            {formatBytes(alert.source?.bytes ?? alert.destination?.bytes ?? alert.network?.bytes)}
          </span>
        )}
      </div>
      {alert.destination?.domain && (
        <div className="text-[10px] text-muted/40 font-mono">{alert.destination.domain}</div>
      )}
    </div>
  );
}

function AuthDetail({ alert }: { alert: SecurityAlert }) {
  if (alert.event?.category !== "authentication") return null;
  return (
    <div className="mt-2 space-y-1.5">
      {(alert.source?.ip || alert.destination?.ip) && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-primary/70">{alert.source?.ip || "?"}</span>
          <span className="text-muted/30">→</span>
          <span className="text-primary/70">
            {alert.destination?.ip || "?"}
            {alert.destination?.port ? `:${alert.destination.port}` : ""}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {alert.user?.name && (
          <span className="text-[10px] text-primary/60 font-mono">{alert.user.domain ? `${alert.user.domain}\\` : ""}{alert.user.name}</span>
        )}
        {alert.event?.outcome && (
          <span className={`text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 border ${
            alert.event.outcome === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-accent-red/10 text-accent-red border-accent-red/20"
          }`}>
            {alert.event.outcome}
          </span>
        )}
        {alert.network?.protocol && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-primary/5 border border-divider text-muted/50">
            {alert.network.protocol}
          </span>
        )}
      </div>
    </div>
  );
}

function FileDetail({ alert }: { alert: SecurityAlert }) {
  if (!alert.file?.name && !alert.file?.path) return null;
  return (
    <div className="mt-2 space-y-1">
      {alert.file?.path && (
        <div className="text-[11px] text-primary/70 font-mono truncate">{alert.file.path}</div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {alert.file?.size != null && (
          <span className="text-[10px] text-muted/40">{formatBytes(alert.file.size)}</span>
        )}
        {alert.event?.action && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 bg-primary/5 border border-divider text-muted/50">
            {alert.event.action}
          </span>
        )}
      </div>
      {alert.file?.hash?.sha256 && (
        <div className="text-[10px] text-muted/30 font-mono truncate">SHA256: {alert.file.hash.sha256}</div>
      )}
    </div>
  );
}

function EmailDetail({ alert }: { alert: SecurityAlert }) {
  if (!alert.email?.subject) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-muted/40">From:</span>
        <span className="text-primary/70 font-mono">{alert.email.from || "—"}</span>
        <span className="text-muted/30">→</span>
        <span className="text-muted/40">To:</span>
        <span className="text-primary/70 font-mono">{alert.email.to || "—"}</span>
      </div>
      <div className="text-[11px] text-primary/60">
        <span className="text-muted/40">Subject:</span>{" "}
        {alert.email.subject}
      </div>
      {alert.email.attachments?.file?.name && (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-muted/40">Attachment:</span>
          <span className="text-primary/60 font-mono">{alert.email.attachments.file.name}</span>
          {alert.email.attachments.file.hash?.sha256 && (
            <span className="text-muted/30 font-mono truncate max-w-[200px]">{alert.email.attachments.file.hash.sha256}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Event Card ──────────────────────────────────────────────────────

function EventCard({
  alert,
  index,
  tacticColor,
  onClick,
}: {
  alert: SecurityAlert;
  index: number;
  tacticColor: string;
  onClick?: () => void;
}) {
  const category = alert.event?.category;

  return (
    <div
      className="relative pl-6 pb-4 cursor-pointer group/event"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
    >
      {/* Timeline connector */}
      <div
        className="absolute left-[7px] top-0 bottom-0 w-px"
        style={{ backgroundColor: tacticColor, opacity: 0.15 }}
      />
      {/* Timeline dot */}
      <div
        className="absolute left-0 top-1 w-[15px] h-[15px] border-2 bg-base flex items-center justify-center"
        style={{ borderColor: tacticColor }}
      >
        <div
          className="w-[5px] h-[5px]"
          style={{ backgroundColor: tacticColor }}
        />
      </div>

      {/* Card */}
      <div className="bg-base-dark/40 border border-divider p-3 hover:shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200">
        {/* Header: timestamp + severity + risk */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[11px] font-mono text-muted/50 tabular-nums">
            {safeFormat(alert["@timestamp"], "HH:mm:ss.SSS")}
          </span>
          <SeverityBadge severity={alert.alert?.severity} eventSeverity={alert.event?.severity} />
          {alert.event?.risk_score != null && (
            <span className="text-[9px] font-bold text-muted/40 tracking-[0.1em]">
              RISK {alert.event.risk_score}
            </span>
          )}
          <MitreBadge
            techniqueId={alert.threat?.technique?.id}
            techniqueName={alert.threat?.technique?.name}
          />
        </div>

        {/* Message */}
        <p className="text-[12px] text-primary/80 leading-relaxed group-hover/event:text-primary transition-colors">
          {alert.message || "No description"}
        </p>

        {/* Rule signature */}
        {alert.rule?.name && (
          <div className="text-[10px] text-muted/40 mt-1">
            <span className="uppercase tracking-[0.08em]">Rule:</span> {alert.rule.name}
          </div>
        )}

        {/* Category-specific forensic details */}
        {category === "process" && <ProcessDetail alert={alert} />}
        {category === "network" && <NetworkDetail alert={alert} />}
        {category === "authentication" && <AuthDetail alert={alert} />}
        {category === "file" && <FileDetail alert={alert} />}
        {category === "email" && <EmailDetail alert={alert} />}

        {/* Fallback network detail for non-network categories that still have network data */}
        {category !== "network" && category !== "authentication" && (alert.source?.ip || alert.destination?.ip) && (alert.network?.protocol || alert.source?.bytes || alert.destination?.bytes) && (
          <NetworkDetail alert={alert} />
        )}
      </div>
    </div>
  );
}

// ── Main Drawer ─────────────────────────────────────────────────────

export default function KillChainDrawer({ tactic, tacticColor, onClose, onEventClick }: KillChainDrawerProps) {
  const [events, setEvents] = useState<SecurityAlert[]>([]);
  const [summary, setSummary] = useState<StageSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/killchain/events?tactic=${encodeURIComponent(tactic)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setEvents(data.events || []);
        setSummary(data.summary || null);
        setTotal(data.total || 0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tactic]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-30" onClick={onClose} />

      {/* Drawer panel */}
      <div
        data-testid="killchain-drawer"
        className="fixed top-0 right-0 h-full w-[560px] max-w-full bg-base border-l-2 z-35 overflow-y-auto shadow-brutal animate-slide-up"
        style={{ borderLeftColor: tacticColor, zIndex: 35 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-base border-b border-divider px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3" style={{ backgroundColor: tacticColor }} />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.05em] text-primary">
              {tactic}
            </h3>
            <span className="text-[10px] text-muted/40 font-bold tracking-[0.1em]">
              {total} EVENTS
            </span>
          </div>
          <button onClick={onClose} className="text-muted/40 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Summary Header */}
        {summary && !loading && (
          <div className="px-5 py-4 border-b border-divider bg-base-dark/30 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Time Span</span>
                <div className="text-primary/70 font-mono mt-0.5">
                  {safeFormat(summary.firstEvent, "HH:mm:ss")} → {safeFormat(summary.lastEvent, "HH:mm:ss")}
                  <span className="text-muted/30 ml-1">
                    ({formatDuration(summary.firstEvent, summary.lastEvent)})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Max Risk Score</span>
                <div className="font-bold mt-0.5" style={{ color: tacticColor }}>
                  {summary.maxRiskScore} / 100
                </div>
              </div>
              {summary.techniqueIds.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Techniques</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {summary.techniqueIds.map((id) => (
                      <span key={id} className="text-[10px] font-bold px-1.5 py-0.5 bg-accent-red/8 text-accent-red border border-accent-red/20 tracking-[0.05em]">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {summary.hosts.length > 0 && (
                <div>
                  <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Hosts</span>
                  <div className="text-primary/60 font-mono mt-0.5">{summary.hosts.join(", ")}</div>
                </div>
              )}
              {summary.users.length > 0 && (
                <div>
                  <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Users</span>
                  <div className="text-primary/60 font-mono mt-0.5">{summary.users.join(", ")}</div>
                </div>
              )}
              {(summary.sourceIps.length > 0 || summary.destIps.length > 0) && (
                <div className="col-span-2">
                  <span className="text-muted/40 uppercase tracking-[0.1em] text-[9px]">Key IPs</span>
                  <div className="text-primary/60 font-mono mt-0.5">
                    {summary.sourceIps.join(", ")}
                    {summary.sourceIps.length > 0 && summary.destIps.length > 0 && (
                      <span className="text-muted/30"> → </span>
                    )}
                    {summary.destIps.join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted/40" />
              <span className="text-sm text-muted/40 ml-2">Loading events…</span>
            </div>
          )}

          {error && (
            <div className="bg-accent-red/10 border-l-4 border-accent-red p-4">
              <p className="text-sm text-accent-red font-bold">Failed to load</p>
              <p className="text-xs text-muted/60 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-muted/40 text-center py-12">No events found for this tactic.</p>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="relative">
              {events.map((event, i) => (
                <EventCard
                  key={`${event["@timestamp"]}-${i}`}
                  alert={event}
                  index={i}
                  tacticColor={tacticColor}
                  onClick={() => onEventClick?.(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
