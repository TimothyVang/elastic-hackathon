// TypeScript interfaces for the 3 ECS-compatible Elasticsearch indices

// ── security-alerts index ────────────────────────────────────────────

export interface SecurityAlert {
  "@timestamp": string;
  message?: string;
  tags?: string[];
  event?: {
    kind?: string;
    category?: string;
    type?: string;
    action?: string;
    outcome?: string;
    severity?: number;
    risk_score?: number;
  };
  source?: {
    ip?: string;
    port?: number;
    mac?: string;
    domain?: string;
    bytes?: number;
  };
  destination?: {
    ip?: string;
    port?: number;
    domain?: string;
    bytes?: number;
  };
  host?: {
    name?: string;
    hostname?: string;
    ip?: string;
    os?: { name?: string; platform?: string };
  };
  process?: {
    name?: string;
    pid?: number;
    executable?: string;
    command_line?: string;
    args?: string[];
    parent?: {
      name?: string;
      pid?: number;
      executable?: string;
      command_line?: string;
    };
    hash?: { sha256?: string; md5?: string };
  };
  user?: { name?: string; domain?: string; id?: string };
  file?: {
    name?: string;
    path?: string;
    extension?: string;
    size?: number;
    hash?: { sha256?: string; md5?: string };
  };
  network?: {
    protocol?: string;
    direction?: string;
    bytes?: number;
    transport?: string;
  };
  email?: {
    from?: string;
    to?: string;
    subject?: string;
    attachments?: {
      file?: { name?: string; extension?: string; hash?: { sha256?: string } };
    };
  };
  threat?: {
    framework?: string;
    tactic?: { id?: string; name?: string };
    technique?: {
      id?: string;
      name?: string;
      subtechnique?: { id?: string; name?: string };
    };
  };
  alert?: { severity?: string; signature?: string; category?: string };
  rule?: { name?: string; id?: string; description?: string };
}

// ── threat-intel index ───────────────────────────────────────────────

export interface ThreatIntel {
  "@timestamp": string;
  ioc?: {
    type?: string;
    value?: string;
    description?: string;
  };
  threat?: {
    framework?: string;
    tactic?: { id?: string; name?: string };
    technique?: {
      id?: string;
      name?: string;
      subtechnique?: { id?: string; name?: string };
    };
  };
  severity?: string;
  confidence?: number;
  tags?: string[];
  source?: string;
  first_seen?: string;
  last_seen?: string;
  active?: boolean;
}

// ── incident-log index ───────────────────────────────────────────────

export interface IncidentLog {
  "@timestamp": string;
  incident?: {
    id?: string;
    title?: string;
    description?: string;
    severity?: string;
    status?: string;
    priority?: string;
  };
  affected_hosts?: string[];
  affected_users?: string[];
  source_ips?: string[];
  kill_chain_phase?: string[];
  mitre_techniques?: string[];
  event_count?: number;
  first_event?: string;
  last_event?: string;
  time_span_minutes?: number;
  containment_actions?: string;
  analyst_notes?: string;
  risk_score?: number;
  triage_result?: string;
}

// ── Dashboard types ──────────────────────────────────────────────────

export interface DashboardStats {
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  severityCounts: { name: string; value: number; color: string }[];
  eventsByHour: { hour: string; count: number }[];
  recentAlerts: SecurityAlert[];
  categoryCounts: { category: string; count: number }[];
}

// ── Hunt tool result types ───────────────────────────────────────────

export interface CorrelatedEvent {
  "@timestamp": string;
  message: string;
  "source.ip": string;
  "destination.ip": string;
  "event.category": string;
  "event.action": string;
  "event.severity": number;
  "threat.technique.id": string;
  "threat.technique.name": string;
  "host.name": string;
  "user.name": string;
  "process.name": string;
  "alert.severity": string;
}

export interface BeaconingResult {
  "destination.ip": string;
  "destination.domain": string;
  "source.ip": string;
  beacon_count: number;
  total_bytes: number;
  first_seen: string;
  last_seen: string;
  duration_minutes: number;
  avg_interval_seconds: number;
}

export interface LateralMovementResult {
  "source.ip": string;
  "user.name": string;
  host_count: number;
  hosts: string[];
  first_seen: string;
  last_seen: string;
}

export interface ProcessChainEvent {
  "@timestamp": string;
  "process.name": string;
  "process.pid": number;
  "process.command_line": string;
  "process.parent.name": string;
  "process.parent.pid": number;
  "user.name": string;
  "event.action": string;
  "threat.technique.id": string;
  "alert.severity": string;
}
