import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const kibanaUrl =
    process.env.KIBANA_URL || process.env.NEXT_PUBLIC_KIBANA_URL;
  const apiKey = process.env.ELASTIC_API_KEY;

  if (!kibanaUrl || !apiKey) {
    return NextResponse.json({ connected: false, error: "KIBANA_URL or ELASTIC_API_KEY not configured" });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `ApiKey ${apiKey}`,
    "kbn-xsrf": "true",
    "x-elastic-internal-origin": "Kibana",
  };

  try {
    // Fetch agent metadata and tools list in parallel
    const [agentRes, toolsRes] = await Promise.all([
      fetch(`${kibanaUrl}/api/agent_builder/agents/dco_triage_agent`, { headers }),
      fetch(`${kibanaUrl}/api/agent_builder/tools`, { headers }),
    ]);

    if (!agentRes.ok) {
      const errBody = await agentRes.text();
      return NextResponse.json({
        connected: false,
        error: `Agent fetch failed (${agentRes.status}): ${errBody}`,
      });
    }

    const agent = await agentRes.json();

    let tools: unknown[] = [];
    if (toolsRes.ok) {
      const toolsData = await toolsRes.json();
      // Tools response may be an array or { tools: [...] }
      tools = Array.isArray(toolsData) ? toolsData : toolsData.tools || [];
    }

    return NextResponse.json({
      connected: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        tool_count: agent.configuration?.tools?.[0]?.tool_ids?.length || 0,
      },
      tools: (tools as Array<Record<string, unknown>>).map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ connected: false, error: msg });
  }
}
