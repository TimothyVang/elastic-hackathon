import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";
import { ESQL_QUERIES } from "@/lib/queries";
import { esqlToRows } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Smart triage chat endpoint.
 *
 * 1. Tries Kibana Agent Builder chat API if configured.
 * 2. Falls back to local triage using the SAME ES|QL tools as the Agent Builder agent.
 *
 * This ensures the dashboard demonstrates real Elastic Agent Builder tool usage
 * regardless of whether the Kibana chat API is available.
 */

// Analyze message to determine which Agent Builder tools to invoke
function analyzeMessage(msg: string): {
  tools: string[];
  ip?: string;
  hostname?: string;
} {
  const lower = msg.toLowerCase();
  const tools: string[] = [];

  const ipMatch = msg.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  const ip = ipMatch ? ipMatch[1] : undefined;

  const hostMatch = msg.match(/\b(WS-\w+|SRV-\w+|DC-\d+)\b/i);
  const hostname = hostMatch ? hostMatch[1] : undefined;

  // Full triage request → run all tools
  if (
    lower.includes("triage") ||
    lower.includes("investigate") ||
    (lower.includes("analyze") && lower.includes("alert"))
  ) {
    return {
      tools: ["correlate", "beaconing", "lateral", "process", "intel"],
      ip: ip || "10.10.15.42",
      hostname: hostname || "WS-PC0142",
    };
  }

  if (ip) tools.push("correlate");
  if (lower.includes("beacon") || lower.includes("c2") || lower.includes("command and control"))
    tools.push("beaconing");
  if (lower.includes("lateral") || lower.includes("movement")) tools.push("lateral");
  if (hostname || lower.includes("process") || lower.includes("chain"))
    tools.push("process");
  if (lower.includes("threat") || lower.includes("intel") || lower.includes("ioc"))
    tools.push("intel");

  // Default: full triage
  if (tools.length === 0) {
    return {
      tools: ["correlate", "beaconing", "lateral", "process", "intel"],
      ip: ip || "10.10.15.42",
      hostname: hostname || "WS-PC0142",
    };
  }

  return { tools, ip, hostname };
}

// Run ES|QL tools and format results
async function runLocalTriage(
  tools: string[],
  ip?: string,
  hostname?: string
): Promise<{ response: string; toolsUsed: string[] }> {
  const es = getESClient();
  const toolsUsed: string[] = [];
  const sections: string[] = [];

  sections.push("## DCO Triage Report\n");

  // Tool: Correlated Events by IP
  if (tools.includes("correlate") && ip) {
    try {
      const resp = await es.esql.query({
        query: ESQL_QUERIES.correlated_events_by_ip,
        params: [{ source_ip: ip }],
        format: "json",
      });
      const rows = esqlToRows(resp.columns, resp.values);
      toolsUsed.push("correlated_events_by_ip");

      if (rows.length > 0) {
        sections.push(`### Correlated Events for ${ip}\n`);
        sections.push(`Found **${rows.length} events** in 24h window.\n`);
        sections.push(
          "| Time | Message | Severity | MITRE | Host |\n|------|---------|----------|-------|------|"
        );
        rows.slice(0, 15).forEach((r) => {
          const ts = r["@timestamp"]
            ? new Date(r["@timestamp"] as string).toLocaleTimeString()
            : "-";
          sections.push(
            `| ${ts} | ${(r.message as string || "-").substring(0, 60)} | ${r["alert.severity"] || "-"} | ${r["threat.technique.id"] || "-"} | ${r["host.name"] || "-"} |`
          );
        });
        sections.push("");
      }
    } catch (e) {
      sections.push(`> Correlate tool error: ${e instanceof Error ? e.message : "unknown"}\n`);
    }
  }

  // Tool: Beaconing Detection
  if (tools.includes("beaconing")) {
    try {
      const resp = await es.esql.query({
        query: ESQL_QUERIES.beaconing_detection,
        format: "json",
      });
      const rows = esqlToRows(resp.columns, resp.values);
      toolsUsed.push("beaconing_detection");

      if (rows.length > 0) {
        sections.push("### Beaconing / C2 Detection\n");
        sections.push(
          "| Dest IP | Domain | Source IP | Beacons | Avg Interval |\n|---------|--------|----------|---------|--------------|"
        );
        rows.forEach((r) => {
          sections.push(
            `| ${r["destination.ip"] || "-"} | ${r["destination.domain"] || "-"} | ${r["source.ip"] || "-"} | ${r.beacon_count || "-"} | ${Math.round(Number(r.avg_interval_seconds) || 0)}s |`
          );
        });
        sections.push("");
      } else {
        sections.push("### Beaconing Detection\nNo C2 beaconing patterns detected.\n");
      }
    } catch (e) {
      sections.push(`> Beaconing tool error: ${e instanceof Error ? e.message : "unknown"}\n`);
    }
  }

  // Tool: Lateral Movement
  if (tools.includes("lateral")) {
    try {
      const resp = await es.esql.query({
        query: ESQL_QUERIES.lateral_movement_detection,
        format: "json",
      });
      const rows = esqlToRows(resp.columns, resp.values);
      toolsUsed.push("lateral_movement_detection");

      if (rows.length > 0) {
        sections.push("### Lateral Movement\n");
        sections.push(
          "| Source IP | User | Host Count | Hosts |\n|----------|------|------------|-------|"
        );
        rows.forEach((r) => {
          const hosts = Array.isArray(r.hosts) ? (r.hosts as string[]).join(", ") : String(r.hosts || "-");
          sections.push(
            `| ${r["source.ip"] || "-"} | ${r["user.name"] || "-"} | **${r.host_count || "-"}** | ${hosts} |`
          );
        });
        sections.push("");
      } else {
        sections.push("### Lateral Movement\nNo lateral movement patterns detected.\n");
      }
    } catch (e) {
      sections.push(`> Lateral movement tool error: ${e instanceof Error ? e.message : "unknown"}\n`);
    }
  }

  // Tool: Process Chain Analysis
  if (tools.includes("process") && hostname) {
    try {
      const resp = await es.esql.query({
        query: ESQL_QUERIES.process_chain_analysis,
        params: [{ hostname }],
        format: "json",
      });
      const rows = esqlToRows(resp.columns, resp.values);
      toolsUsed.push("process_chain_analysis");

      if (rows.length > 0) {
        sections.push(`### Process Chain on ${hostname}\n`);
        sections.push(
          "| Time | Process | PID | Command | MITRE |\n|------|---------|-----|---------|-------|"
        );
        rows.slice(0, 10).forEach((r) => {
          const ts = r["@timestamp"]
            ? new Date(r["@timestamp"] as string).toLocaleTimeString()
            : "-";
          const cmd = ((r["process.command_line"] as string) || "-").substring(0, 40);
          sections.push(
            `| ${ts} | ${r["process.name"] || "-"} | ${r["process.pid"] || "-"} | ${cmd} | ${r["threat.technique.id"] || "-"} |`
          );
        });
        sections.push("");
      }
    } catch (e) {
      sections.push(`> Process chain tool error: ${e instanceof Error ? e.message : "unknown"}\n`);
    }
  }

  // Tool: Threat Intel Lookup
  if (tools.includes("intel")) {
    try {
      const searchValue = ip || "";
      const resp = await es.search({
        index: "threat-intel",
        size: 10,
        query: searchValue
          ? {
              multi_match: {
                query: searchValue,
                fields: ["indicator.value", "description", "threat.technique.id"],
              },
            }
          : { match_all: {} },
      });
      toolsUsed.push("threat_intel_lookup");

      const hits = resp.hits?.hits || [];
      if (hits.length > 0) {
        sections.push("### Threat Intel Matches\n");
        sections.push(
          "| Type | Value | Description | MITRE | Confidence |\n|------|-------|-------------|-------|------------|"
        );
        hits.slice(0, 8).forEach((h) => {
          const s = h._source as Record<string, unknown> || {};
          const indicator = (s.indicator || {}) as Record<string, unknown>;
          const threat = (s.threat || {}) as Record<string, unknown>;
          const technique = (threat.technique || {}) as Record<string, unknown>;
          sections.push(
            `| ${indicator.type || "-"} | ${((indicator.value as string) || "-").substring(0, 30)} | ${((s.description as string) || "-").substring(0, 40)} | ${technique.id || "-"} | ${indicator.confidence || "-"}% |`
          );
        });
        sections.push("");
      }
    } catch (e) {
      sections.push(`> Threat intel tool error: ${e instanceof Error ? e.message : "unknown"}\n`);
    }
  }

  // Summary
  sections.push("---");
  sections.push(
    `**Agent Builder Tools Used:** ${toolsUsed.join(", ")} (${toolsUsed.length}/5 tools)`
  );

  return { response: sections.join("\n"), toolsUsed };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Ping check
    if (message === "__ping__") {
      try {
        getESClient();
        return NextResponse.json({ status: "ok" });
      } catch {
        return NextResponse.json({ error: "ES not configured" }, { status: 503 });
      }
    }

    // Try Kibana Agent Builder chat API first
    const kibanaUrl = process.env.KIBANA_URL;
    const apiKey = process.env.ELASTIC_API_KEY;
    const agentId = process.env.AGENT_BUILDER_AGENT_ID;

    if (kibanaUrl && apiKey && agentId) {
      try {
        const response = await fetch(
          `${kibanaUrl}/api/agent_builder/agents/${agentId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `ApiKey ${apiKey}`,
              "kbn-xsrf": "true",
            },
            body: JSON.stringify({ message }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            response: data.response || data.message || JSON.stringify(data),
            toolsUsed: ["kibana_agent_builder"],
          });
        }
      } catch {
        // Agent Builder API unavailable — fall through to local triage
      }
    }

    // Fall back to local triage using the same ES|QL tools
    const { tools, ip, hostname } = analyzeMessage(message);
    const result = await runLocalTriage(tools, ip, hostname);

    return NextResponse.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
