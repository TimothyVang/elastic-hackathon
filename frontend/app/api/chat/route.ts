import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy chat messages to the Elastic Agent Builder agent API.
 *
 * Expects KIBANA_URL and ELASTIC_API_KEY env vars plus the agent ID
 * created by setup_agent_builder.py.
 *
 * If the Agent Builder API is unavailable the frontend falls back to
 * showing a pre-recorded triage result, so returning a 503 here is fine.
 */
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Ping check — the frontend uses this to test agent availability
    if (message === "__ping__") {
      const kibanaUrl = process.env.KIBANA_URL;
      if (!kibanaUrl) {
        return NextResponse.json(
          { error: "KIBANA_URL not configured" },
          { status: 503 }
        );
      }
      return NextResponse.json({ status: "ok" });
    }

    const kibanaUrl = process.env.KIBANA_URL;
    const apiKey = process.env.ELASTIC_API_KEY;

    if (!kibanaUrl || !apiKey) {
      return NextResponse.json(
        { error: "Agent Builder not configured (missing KIBANA_URL or ELASTIC_API_KEY)" },
        { status: 503 }
      );
    }

    // Forward to Agent Builder chat API
    // The agent ID is discovered at setup time; we look for the
    // DCO Triage Agent by listing agents first if needed.
    const agentId = process.env.AGENT_BUILDER_AGENT_ID;

    if (!agentId) {
      return NextResponse.json(
        { error: "AGENT_BUILDER_AGENT_ID not configured" },
        { status: 503 }
      );
    }

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
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Agent Builder responded with ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      response: data.response || data.message || JSON.stringify(data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
