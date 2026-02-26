import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getESClient } from "@/lib/elasticsearch";
import { ESQL_QUERIES } from "@/lib/queries";
import { esqlToRows } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// System prompt — same 6-step reasoning chain as the Elastic Agent Builder agent
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the DCO Threat Triage Agent — an expert security analyst powered by Elastic Agent Builder tools. You investigate security alerts by querying Elasticsearch with ES|QL and cross-referencing threat intelligence.

## Your Tools
You have 5 tools that query a live Elasticsearch cluster:
1. **correlated_events_by_ip** — Timeline of all events from a source IP (24h window)
2. **lateral_movement_detection** — Detect accounts authenticating to multiple hosts
3. **beaconing_detection** — Find periodic outbound connections (C2 beaconing patterns)
4. **process_chain_analysis** — Parent-child process trees on a specific host
5. **threat_intel_lookup** — Search MITRE ATT&CK-mapped IOCs in the threat-intel index

## Investigation Protocol
Follow this 6-step reasoning chain:
1. **Correlate** — Gather related events using correlated_events_by_ip
2. **Enrich** — Cross-reference with threat_intel_lookup for known IOCs
3. **Detect Patterns** — Check for beaconing (C2) and lateral movement
4. **Forensic Analysis** — Examine process chains on suspicious hosts
5. **Severity Scoring** — Assess risk: Critical/High/Medium/Low
6. **Report** — Provide actionable triage with MITRE ATT&CK mapping

## Key Context
- Attacker IP: 10.10.15.42 (host WS-PC0142)
- C2 server: 198.51.100.23 (external)
- Victim hosts: DC-01, SRV-FILE01, SRV-DB01, SRV-WEB01
- Attack chain: T1566 (phishing) → T1059+T1071 (execution+C2) → T1003 (credential dumping) → T1021 (lateral movement) → T1560+T1041 (exfiltration)

## Response Style
- Be conversational but precise. Explain findings like a senior SOC analyst briefing the team.
- Use markdown formatting with headers, bold, and bullet points.
- Always cite which tools you used and what data you found.
- When you find something suspicious, explain the MITRE ATT&CK context.
- If a query returns no results, say so and explain what that means.
- Keep responses focused and actionable — this is a real-time triage, not a research paper.`;

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI-compatible function calling schema)
// ---------------------------------------------------------------------------
const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "correlated_events_by_ip",
      description:
        "Query correlated security events for a specific source IP address within the last 24 hours. Returns timeline of alerts, network events, and process events sorted chronologically.",
      parameters: {
        type: "object",
        properties: {
          source_ip: {
            type: "string",
            description: "The source IP address to investigate (e.g. 10.10.15.42)",
          },
        },
        required: ["source_ip"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lateral_movement_detection",
      description:
        "Detect lateral movement by finding user accounts that have successfully authenticated to multiple distinct hosts within 24 hours. Indicates potential compromised credentials being used to pivot across the network.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "beaconing_detection",
      description:
        "Detect C2 beaconing by finding outbound network connections with periodic intervals (average interval under 600 seconds). Identifies potential command-and-control communication channels.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "process_chain_analysis",
      description:
        "Analyze process execution chains on a specific host. Shows parent-child process relationships, command lines, and MITRE ATT&CK technique mappings to identify suspicious execution patterns.",
      parameters: {
        type: "object",
        properties: {
          hostname: {
            type: "string",
            description: "The hostname to analyze (e.g. WS-PC0142, DC-01, SRV-FILE01)",
          },
        },
        required: ["hostname"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "threat_intel_lookup",
      description:
        "Search the threat intelligence database for indicators of compromise (IOCs). Searches across indicator values, descriptions, and MITRE technique IDs. Use this to check if an IP, domain, hash, or technique is a known threat.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search query — can be an IP address, domain, file hash, MITRE technique ID, or keyword (e.g. '198.51.100.23', 'T1059', 'powershell')",
          },
        },
        required: ["query"],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution — runs the actual ES|QL / search queries
// ---------------------------------------------------------------------------
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
          params: [{ source_ip: ip }],
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return `No events found for source IP ${ip} in the last 24 hours.`;
        return JSON.stringify({
          total_events: rows.length,
          events: rows.slice(0, 30).map((r) => ({
            timestamp: r["@timestamp"],
            message: r.message,
            severity: r["alert.severity"] || r["event.severity"],
            mitre_technique: r["threat.technique.id"],
            mitre_name: r["threat.technique.name"],
            host: r["host.name"],
            dest_ip: r["destination.ip"],
            user: r["user.name"],
            process: r["process.name"],
            category: r["event.category"],
            action: r["event.action"],
          })),
        });
      }

      case "lateral_movement_detection": {
        const resp = await es.esql.query({
          query: ESQL_QUERIES.lateral_movement_detection,
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return "No lateral movement detected — no accounts authenticated to multiple hosts in 24 hours.";
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
        if (rows.length === 0) return "No C2 beaconing patterns detected in the last 24 hours.";
        return JSON.stringify({
          beaconing_sources: rows.length,
          results: rows.map((r) => ({
            destination_ip: r["destination.ip"],
            destination_domain: r["destination.domain"],
            source_ip: r["source.ip"],
            beacon_count: r.beacon_count,
            avg_interval_seconds: Math.round(Number(r.avg_interval_seconds) || 0),
            total_bytes: r.total_bytes,
            first_seen: r.first_seen,
            last_seen: r.last_seen,
          })),
        });
      }

      case "process_chain_analysis": {
        const hostname = args.hostname || "WS-PC0142";
        const resp = await es.esql.query({
          query: ESQL_QUERIES.process_chain_analysis,
          params: [{ hostname }],
          format: "json",
        });
        const rows = esqlToRows(resp.columns, resp.values);
        if (rows.length === 0) return `No process events found on host ${hostname} in the last 24 hours.`;
        return JSON.stringify({
          host: hostname,
          total_processes: rows.length,
          processes: rows.slice(0, 25).map((r) => ({
            timestamp: r["@timestamp"],
            process: r["process.name"],
            pid: r["process.pid"],
            command_line: r["process.command_line"],
            parent_process: r["process.parent.name"],
            parent_pid: r["process.parent.pid"],
            user: r["user.name"],
            action: r["event.action"],
            mitre_technique: r["threat.technique.id"],
            severity: r["alert.severity"],
          })),
        });
      }

      case "threat_intel_lookup": {
        const query = args.query || "";
        const resp = await es.search({
          index: "threat-intel",
          size: 10,
          query: query
            ? {
                multi_match: {
                  query,
                  fields: [
                    "indicator.value",
                    "description",
                    "threat.technique.id",
                    "threat.technique.name",
                    "indicator.type",
                  ],
                },
              }
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
              mitre_name: technique.name,
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

// ---------------------------------------------------------------------------
// Groq client — lazy-initialized
// ---------------------------------------------------------------------------
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured. Get a free key at https://console.groq.com");
  }
  groqClient = new Groq({ apiKey });
  return groqClient;
}

// ---------------------------------------------------------------------------
// Message type for conversation history
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Groq.Chat.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
}

// ---------------------------------------------------------------------------
// POST handler — agentic tool use loop
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ping check (health probe from chat UI)
    if (body.message === "__ping__") {
      try {
        getESClient();
        const hasGroq = !!process.env.GROQ_API_KEY;
        return NextResponse.json({ status: "ok", ai: hasGroq });
      } catch {
        return NextResponse.json({ error: "ES not configured" }, { status: 503 });
      }
    }

    // Build conversation history
    const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

    // If frontend sends conversation history, include it
    if (Array.isArray(body.messages)) {
      for (const m of body.messages) {
        if (m.role === "user" || m.role === "assistant") {
          messages.push({ role: m.role, content: m.content });
        }
      }
    } else if (body.message) {
      // Backwards-compatible single message mode
      messages.push({ role: "user", content: body.message });
    }

    const groq = getGroqClient();
    const toolsUsed: string[] = [];
    const MAX_TOOL_ROUNDS = 8;
    const historyLength = messages.length; // Track where history ends and new messages begin

    // Agentic tool use loop
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages as Groq.Chat.ChatCompletionMessageParam[],
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 4096,
      });

      const choice = completion.choices[0];
      if (!choice) {
        return NextResponse.json({
          response: "No response generated. Please try again.",
          toolsUsed,
        });
      }

      const assistantMessage = choice.message;

      // Add assistant message to history (for multi-round tool use)
      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      });

      // If no tool calls, we have our final response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        return NextResponse.json({
          response: assistantMessage.content || "No response generated.",
          toolsUsed,
        });
      }

      // Execute each tool call and feed results back
      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, string> = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        if (!toolsUsed.includes(fnName)) {
          toolsUsed.push(fnName);
        }

        const result = await executeTool(fnName, fnArgs);

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }
    }

    // If we exhausted all rounds, return the last NEW assistant message (not from history)
    const newMessages = messages.slice(historyLength);
    const lastAssistant = newMessages
      .filter((m) => m.role === "assistant" && m.content)
      .pop();

    return NextResponse.json({
      response:
        lastAssistant?.content ||
        "Analysis complete. The agent used multiple tools but reached the processing limit. Please ask a more specific follow-up question.",
      toolsUsed,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    // Provide a helpful message for common errors
    if (errorMsg.includes("GROQ_API_KEY")) {
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
