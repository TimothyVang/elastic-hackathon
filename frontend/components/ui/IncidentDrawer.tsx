"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import type { IncidentLog } from "@/lib/types";

interface IncidentDrawerProps {
  incident: IncidentLog | null;
  onClose: () => void;
}

function safeFormat(ts: string | undefined, fmt: string): string {
  if (!ts) return "—";
  try { return format(new Date(ts), fmt); }
  catch { return ts; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-muted/50 uppercase tracking-[0.15em] mb-2">{title}</h4>
      <div className="bg-base-dark/40 border border-divider p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted/60">{label}</span>
      <span className="text-primary/80 font-medium text-right max-w-[60%] break-all">{String(value)}</span>
    </div>
  );
}

export default function IncidentDrawer({ incident, onClose }: IncidentDrawerProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  if (!incident) return null;

  return (
    <>
      <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-base border-l-2 border-primary z-50 overflow-y-auto shadow-brutal animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-base border-b border-divider px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.05em] text-primary">Incident Details</h3>
          <button onClick={onClose} className="text-muted/40 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title & Timestamp */}
          <div>
            <p className="text-sm text-primary leading-relaxed font-medium">{incident.incident?.title || "Untitled Incident"}</p>
            <p className="text-[10px] text-muted/50 mt-1 tracking-[0.08em]">
              {safeFormat(incident["@timestamp"], "yyyy-MM-dd HH:mm:ss")}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <SeverityBadge severity={incident.incident?.severity} />
            <StatusBadge status={incident.incident?.status} />
            {incident.incident?.priority && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border bg-primary/5 text-primary/70 border-primary/15">
                {incident.incident.priority}
              </span>
            )}
          </div>

          {/* Summary */}
          <Section title="Summary">
            <Field label="Description" value={incident.incident?.description} />
            <Field label="Triage Result" value={incident.triage_result} />
            <Field label="Risk Score" value={incident.risk_score} />
            <Field label="Event Count" value={incident.event_count} />
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <Field label="First Event" value={safeFormat(incident.first_event, "yyyy-MM-dd HH:mm:ss")} />
            <Field label="Last Event" value={safeFormat(incident.last_event, "yyyy-MM-dd HH:mm:ss")} />
            <Field label="Time Span" value={incident.time_span_minutes ? `${incident.time_span_minutes} minutes` : undefined} />
          </Section>

          {/* Affected Assets */}
          {(incident.affected_hosts?.length || incident.affected_users?.length || incident.source_ips?.length) && (
            <Section title="Affected Assets">
              {incident.affected_hosts && incident.affected_hosts.length > 0 && (
                <Field label="Hosts" value={incident.affected_hosts.join(", ")} />
              )}
              {incident.affected_users && incident.affected_users.length > 0 && (
                <Field label="Users" value={incident.affected_users.join(", ")} />
              )}
              {incident.source_ips && incident.source_ips.length > 0 && (
                <Field label="Source IPs" value={incident.source_ips.join(", ")} />
              )}
            </Section>
          )}

          {/* MITRE Mapping */}
          {(incident.mitre_techniques?.length || incident.kill_chain_phase?.length) && (
            <Section title="MITRE ATT&CK">
              {incident.mitre_techniques && incident.mitre_techniques.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {incident.mitre_techniques.map((t) => (
                    <span key={t} className="inline-flex text-[10px] px-2 py-0.5 bg-accent-red/8 text-accent-red/80 border border-accent-red/20 font-bold uppercase tracking-[0.1em]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {incident.kill_chain_phase && incident.kill_chain_phase.length > 0 && (
                <Field label="Kill Chain" value={incident.kill_chain_phase.join(" → ")} />
              )}
            </Section>
          )}

          {/* Containment & Notes */}
          {incident.containment_actions && (
            <Section title="Containment Actions">
              <p className="text-xs text-primary/70 whitespace-pre-wrap">{incident.containment_actions}</p>
            </Section>
          )}

          {incident.analyst_notes && (
            <Section title="Analyst Notes">
              <p className="text-xs text-primary/70 whitespace-pre-wrap">{incident.analyst_notes}</p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
