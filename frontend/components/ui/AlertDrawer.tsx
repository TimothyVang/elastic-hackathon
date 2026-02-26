"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import SeverityBadge from "@/components/ui/SeverityBadge";
import MitreBadge from "@/components/ui/MitreBadge";
import type { SecurityAlert } from "@/lib/types";

interface AlertDrawerProps {
  alert: SecurityAlert | null;
  onClose: () => void;
}

function safeFormat(ts: string | undefined, fmt: string): string {
  if (!ts) return "—";
  try {
    return format(new Date(ts), fmt);
  } catch {
    return ts;
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="bg-surface-overlay/50 rounded-lg p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-mono text-right max-w-[60%] break-all">
        {String(value)}
      </span>
    </div>
  );
}

export default function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  if (!alert) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-surface-raised border-l border-border-subtle z-50 overflow-y-auto shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface-raised border-b border-border-subtle px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-sm font-semibold text-white">Alert Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Message */}
          <div>
            <p className="text-sm text-gray-200 leading-relaxed">
              {alert.message || "No message"}
            </p>
            <p className="text-xs text-gray-600 mt-1 font-mono">
              {safeFormat(alert["@timestamp"], "yyyy-MM-dd HH:mm:ss.SSS")}
            </p>
          </div>

          {/* Severity + Tags row */}
          <div className="flex flex-wrap gap-2">
            <SeverityBadge severity={alert.alert?.severity} />
            <MitreBadge
              techniqueId={alert.threat?.technique?.id}
              techniqueName={alert.threat?.technique?.name}
            />
            {alert.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Event Info */}
          <Section title="Event">
            <Field label="Category" value={alert.event?.category} />
            <Field label="Action" value={alert.event?.action} />
            <Field label="Type" value={alert.event?.type} />
            <Field label="Outcome" value={alert.event?.outcome} />
            <Field label="Severity" value={alert.event?.severity} />
            <Field label="Risk Score" value={alert.event?.risk_score} />
          </Section>

          {/* Network */}
          {(alert.source?.ip || alert.destination?.ip || alert.network?.protocol) && (
            <Section title="Network">
              <Field label="Source IP" value={alert.source?.ip} />
              <Field label="Source Port" value={alert.source?.port} />
              <Field label="Source Bytes" value={alert.source?.bytes} />
              <Field label="Destination IP" value={alert.destination?.ip} />
              <Field label="Destination Port" value={alert.destination?.port} />
              <Field label="Destination Domain" value={alert.destination?.domain} />
              <Field label="Protocol" value={alert.network?.protocol} />
              <Field label="Direction" value={alert.network?.direction} />
              <Field label="Transport" value={alert.network?.transport} />
            </Section>
          )}

          {/* Host */}
          {alert.host?.name && (
            <Section title="Host">
              <Field label="Name" value={alert.host.name} />
              <Field label="Hostname" value={alert.host.hostname} />
              <Field label="IP" value={alert.host.ip} />
              <Field
                label="OS"
                value={
                  alert.host.os
                    ? `${alert.host.os.name || ""} ${alert.host.os.platform || ""}`.trim()
                    : undefined
                }
              />
            </Section>
          )}

          {/* Process */}
          {alert.process?.name && (
            <Section title="Process">
              <Field label="Name" value={alert.process.name} />
              <Field label="PID" value={alert.process.pid} />
              <Field label="Executable" value={alert.process.executable} />
              {alert.process.command_line && (
                <div className="mt-2">
                  <span className="text-[10px] text-gray-500 uppercase">
                    Command Line
                  </span>
                  <pre className="text-xs text-gray-300 bg-surface/50 rounded p-2 mt-1 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                    {alert.process.command_line}
                  </pre>
                </div>
              )}
              {alert.process.parent?.name && (
                <>
                  <div className="border-t border-border-subtle my-2" />
                  <Field label="Parent Process" value={alert.process.parent.name} />
                  <Field label="Parent PID" value={alert.process.parent.pid} />
                  {alert.process.parent.command_line && (
                    <div className="mt-2">
                      <span className="text-[10px] text-gray-500 uppercase">
                        Parent Command Line
                      </span>
                      <pre className="text-xs text-gray-300 bg-surface/50 rounded p-2 mt-1 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                        {alert.process.parent.command_line}
                      </pre>
                    </div>
                  )}
                </>
              )}
              {alert.process.hash?.sha256 && (
                <Field label="SHA-256" value={alert.process.hash.sha256} />
              )}
            </Section>
          )}

          {/* User */}
          {alert.user?.name && (
            <Section title="User">
              <Field label="Username" value={alert.user.name} />
              <Field label="Domain" value={alert.user.domain} />
              <Field label="User ID" value={alert.user.id} />
            </Section>
          )}

          {/* File */}
          {alert.file?.name && (
            <Section title="File">
              <Field label="Name" value={alert.file.name} />
              <Field label="Path" value={alert.file.path} />
              <Field label="Extension" value={alert.file.extension} />
              <Field label="Size" value={alert.file.size} />
              {alert.file.hash?.sha256 && (
                <Field label="SHA-256" value={alert.file.hash.sha256} />
              )}
            </Section>
          )}

          {/* Email */}
          {alert.email?.subject && (
            <Section title="Email">
              <Field label="From" value={alert.email.from} />
              <Field label="To" value={alert.email.to} />
              <Field label="Subject" value={alert.email.subject} />
              {alert.email.attachments?.file?.name && (
                <Field
                  label="Attachment"
                  value={alert.email.attachments.file.name}
                />
              )}
            </Section>
          )}

          {/* MITRE ATT&CK */}
          {alert.threat?.technique?.id && (
            <Section title="MITRE ATT&CK">
              <Field label="Framework" value={alert.threat.framework} />
              <Field label="Tactic" value={alert.threat.tactic?.name} />
              <Field label="Tactic ID" value={alert.threat.tactic?.id} />
              <Field label="Technique" value={alert.threat.technique.name} />
              <Field label="Technique ID" value={alert.threat.technique.id} />
              {alert.threat.technique.subtechnique?.id && (
                <>
                  <Field
                    label="Sub-technique"
                    value={alert.threat.technique.subtechnique.name}
                  />
                  <Field
                    label="Sub-technique ID"
                    value={alert.threat.technique.subtechnique.id}
                  />
                </>
              )}
            </Section>
          )}

          {/* Rule */}
          {alert.rule?.name && (
            <Section title="Rule">
              <Field label="Name" value={alert.rule.name} />
              <Field label="ID" value={alert.rule.id} />
              <Field label="Description" value={alert.rule.description} />
            </Section>
          )}

          {/* Alert Classification */}
          {(alert.alert?.signature || alert.alert?.category) && (
            <Section title="Alert Classification">
              <Field label="Signature" value={alert.alert.signature} />
              <Field label="Category" value={alert.alert.category} />
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
