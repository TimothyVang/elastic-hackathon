import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";
import { ESQL_QUERIES } from "@/lib/queries";
import { esqlToRows } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Agent Builder converse API proxy
// ---------------------------------------------------------------------------
async function converseWithAgentBuilder(
  messages: { role: string; content: string }[]
): Promise<{ response: string; toolsUsed: string[] }> {
  const kibanaUrl = process.env.KIBANA_URL || process.env.NEXT_PUBLIC_KIBANA_URL;
  const apiKey = process.env.ELASTIC_API_KEY;

  if (!kibanaUrl || !apiKey) {
    throw new Error("KIBANA_URL or ELASTIC_API_KEY not configured");
  }

  // Extract the latest user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    throw new Error("No user message found");
  }

  const res = await fetch(`${kibanaUrl}/api/agent_builder/converse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${apiKey}`,
      "kbn-xsrf": "true",
      "x-elastic-internal-origin": "Kibana",
    },
    body: JSON.stringify({
      input: lastUserMsg.content,
      agent_id: "dco_triage_agent",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Agent Builder API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();

  // Extract tool names from steps
  const toolsUsed: string[] = [];
  if (Array.isArray(data.steps)) {
    for (const step of data.steps) {
      if (step.type === "tool_call" && step.tool_id && !toolsUsed.includes(step.tool_id)) {
        toolsUsed.push(step.tool_id);
      }
    }
  }

  const responseText =
    data.response?.message ||
    data.response ||
    (typeof data.message === "string" ? data.message : null) ||
    "Agent completed analysis but returned no text response.";

  return { response: responseText, toolsUsed };
}

// ---------------------------------------------------------------------------
// Groq fallback — same 6-step reasoning chain as the Elastic Agent Builder agent
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the DCO Threat Triage Agent — a security analyst with ES|QL tools for Elasticsearch. Investigate alerts, correlate events, and provide actionable triage with MITRE ATT&CK mapping.

Key context: Attacker 10.10.15.42 (WS-PC0142), C2 server 198.51.100.23, victims DC-01/SRV-FILE01/SRV-DB01/SRV-WEB01. Attack chain: T1566→T1059+T1071→T1003→T1021→T1560+T1041.

Use tools to investigate, then give a concise analysis with severity rating and recommendations. Use markdown formatting. Be brief.`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "correlated_events_by_ip",
      description:
        "Query correlated security events for a specific source IP address within the last 24 hours.",
      parameters: {
        type: "object",
        properties: {
          source_ip: { type: "string", description: "The source IP address to investigate" },
        },
        required: ["source_ip"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "lateral_movement_detection",
      description: "Detect lateral movement by finding accounts authenticated to multiple hosts.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "beaconing_detection",
      description: "Detect C2 beaconing patterns with periodic outbound connections.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "process_chain_analysis",
      description: "Analyze process execution chains on a specific host.",
      parameters: {
        type: "object",
        properties: {
          hostname: { type: "string", description: "The hostname to analyze" },
        },
        required: ["hostname"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "threat_intel_lookup",
      description: "Search threat intelligence for IOCs by IP, domain, hash, or MITRE technique.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for IOC lookup" },
        },
        required: ["query"],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<string> {
  const es = getESClient();

  try {
    switch (name) {
      case "correlated_events_by_ip": {
        const ip = args.source_ip || "10.10.15.42";
        const resp = await es.esql.query({
          query: ESQL_QUERIES.correlated_events_by_ip,
          params: [ip],
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return `No events found for source IP ${ip} in the last 24 hours.`;
        return JSON.stringify({
          total_events: rows.length,
          events: rows.slice(0, 15).map((r) => ({
            timestamp: r["@timestamp"],
            message: r.message,
            severity: r["alert.severity"] || r["event.severity"],
            mitre_technique: r["threat.technique.id"],
            host: r["host.name"],
            dest_ip: r["destination.ip"],
            user: r["user.name"],
            process: r["process.name"],
            category: r["event.category"],
          })),
        });
      }

      case "lateral_movement_detection": {
        const resp = await es.esql.query({
          query: ESQL_QUERIES.lateral_movement_detection,
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return "No lateral movement detected.";
        return JSON.stringify({
          accounts_with_lateral_movement: rows.length,
          results: rows.map((r) => ({
            source_ip: r["source.ip"],
            user: r["user.name"],
            host_count: r.host_count,
            hosts: r.hosts,
            first_seen: r.first_seen,
            last_seen: r.last_seen,
          })),
        });
      }

      case "beaconing_detection": {
        const resp = await es.esql.query({
          query: ESQL_QUERIES.beaconing_detection,
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return "No C2 beaconing patterns detected.";
        return JSON.stringify({
          beaconing_sources: rows.length,
          results: rows.map((r) => ({
            destination_ip: r["destination.ip"],
            destination_domain: r["destination.domain"],
            source_ip: r["source.ip"],
            beacon_count: r.beacon_count,
            avg_interval_seconds: Math.round(Number(r.avg_interval_seconds) || 0),
            total_bytes: r.total_bytes,
          })),
        });
      }

      case "process_chain_analysis": {
        const hostname = args.hostname || "WS-PC0142";
        const resp = await es.esql.query({
          query: ESQL_QUERIES.process_chain_analysis,
          params: [hostname],
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return `No process events found on host ${hostname}.`;
        return JSON.stringify({
          host: hostname,
          total_processes: rows.length,
          processes: rows.slice(0, 12).map((r) => ({
            timestamp: r["@timestamp"],
            process: r["process.name"],
            pid: r["process.pid"],
            command_line: r["process.command_line"],
            parent_process: r["process.parent.name"],
            user: r["user.name"],
            mitre_technique: r["threat.technique.id"],
          })),
        });
      }

      case "threat_intel_lookup": {
        const query = args.query || "";
        const resp = await es.search({
          index: "threat-intel",
          size: 10,
          query: query
            ? { multi_match: { query, fields: ["indicator.value", "description", "threat.technique.id", "threat.technique.name", "indicator.type"] } }
            : { match_all: {} },
        });
        const hits = resp.hits?.hits || [];
        if (hits.length === 0) return `No threat intelligence matches found for "${query}".`;
        return JSON.stringify({
          matches: hits.length,
          iocs: hits.map((h) => {
            const s = (h._source || {}) as Record<string, unknown>;
            const indicator = (s.indicator || {}) as Record<string, unknown>;
            const threat = (s.threat || {}) as Record<string, unknown>;
            const technique = (threat.technique || {}) as Record<string, unknown>;
            return {
              type: indicator.type,
              value: indicator.value,
              description: s.description,
              mitre_technique: technique.id,
              confidence: indicator.confidence,
              severity: indicator.severity,
            };
          }),
        });
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Tool execution error (${name}): ${msg}`;
  }
}

// Groq API
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
}

async function groqChat(messages: GroqMessage[]): Promise<{
  content: string | null;
  tool_calls?: GroqToolCall[];
}> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : (attempt + 1) * 2000;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error("Groq returned no choices");

    return {
      content: choice.message?.content || null,
      tool_calls: choice.message?.tool_calls,
    };
  }

  throw new Error("Groq API rate limited — please wait a moment and try again.");
}

async function groqFallback(
  messages: { role: string; content: string }[]
): Promise<{ response: string; toolsUsed: string[] }> {
  const groqMessages: GroqMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const m of messages) {
    if (m.role === "user" || m.role === "assistant") {
      groqMessages.push({ role: m.role, content: m.content });
    }
  }

  const toolsUsed: string[] = [];
  const MAX_TOOL_ROUNDS = 8;
  const historyLength = groqMessages.length;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await groqChat(groqMessages);

    groqMessages.push({
      role: "assistant",
      content: result.content || "",
      tool_calls: result.tool_calls,
    });

    if (!result.tool_calls || result.tool_calls.length === 0) {
      return {
        response: result.content || "No response generated.",
        toolsUsed,
      };
    }

    for (const toolCall of result.tool_calls) {
      const fnName = toolCall.function.name;
      let fnArgs: Record<string, string> = {};
      try { fnArgs = JSON.parse(toolCall.function.arguments || "{}"); } catch { fnArgs = {}; }

      if (!toolsUsed.includes(fnName)) toolsUsed.push(fnName);

      const toolResult = await executeTool(fnName, fnArgs);

      groqMessages.push({
        role: "tool",
        content: toolResult,
        tool_call_id: toolCall.id,
      });
    }
  }

  const newMessages = groqMessages.slice(historyLength);
  const lastAssistant = newMessages.filter((m) => m.role === "assistant" && m.content).pop();

  return {
    response: lastAssistant?.content || "Analysis complete — reached processing limit.",
    toolsUsed,
  };
}

// ---------------------------------------------------------------------------
// POST handler — prefer Agent Builder, fallback to Groq
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ping check
    if (body.message === "__ping__") {
      const hasKibana = !!(process.env.KIBANA_URL || process.env.NEXT_PUBLIC_KIBANA_URL);
      const hasGroq = !!process.env.GROQ_API_KEY;
      try {
        getESClient();
        return NextResponse.json({ status: "ok", ai: hasKibana || hasGroq, backend: hasKibana ? "agent_builder" : "groq" });
      } catch {
        return NextResponse.json({ error: "ES not configured" }, { status: 503 });
      }
    }

    // Build message list
    let messages: { role: string; content: string }[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages.filter((m: { role: string }) => m.role === "user" || m.role === "assistant");
    } else if (body.message) {
      messages = [{ role: "user", content: body.message }];
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Try Agent Builder first, then Groq fallback
    const hasKibana = !!(process.env.KIBANA_URL || process.env.NEXT_PUBLIC_KIBANA_URL);

    if (hasKibana) {
      try {
        const result = await converseWithAgentBuilder(messages);
        return NextResponse.json(result);
      } catch (abErr) {
        // If Agent Builder fails and Groq is available, fall through
        const hasGroq = !!process.env.GROQ_API_KEY;
        if (!hasGroq) {
          const msg = abErr instanceof Error ? abErr.message : String(abErr);
          return NextResponse.json({ error: `Agent Builder error: ${msg}` }, { status: 502 });
        }
        // Fall through to Groq
      }
    }

    // Groq fallback
    const result = await groqFallback(messages);
    return NextResponse.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
