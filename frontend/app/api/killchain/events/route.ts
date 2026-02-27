import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";
import type { SecurityAlert } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tactic = request.nextUrl.searchParams.get("tactic");

  if (!tactic) {
    return NextResponse.json(
      { error: "Missing required query parameter: tactic" },
      { status: 400 }
    );
  }

  try {
    const es = getESClient();

    const result = await es.search({
      index: "security-alerts",
      size: 200,
      body: {
        query: {
          term: { "threat.tactic.name": tactic },
        },
        sort: [{ "@timestamp": { order: "asc" } }],
      },
    });

    const hits = result.hits.hits || [];
    const events: SecurityAlert[] = hits.map(
      (h: { _source?: unknown }) => h._source as SecurityAlert
    );
    const total = typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? events.length;

    // Compute stage summary server-side
    const hosts = new Set<string>();
    const users = new Set<string>();
    const sourceIps = new Set<string>();
    const destIps = new Set<string>();
    const techniqueIds = new Set<string>();
    let maxRiskScore = 0;

    for (const e of events) {
      if (e.host?.name) hosts.add(e.host.name);
      if (e.user?.name) users.add(e.user.name);
      if (e.source?.ip) sourceIps.add(e.source.ip);
      if (e.destination?.ip) destIps.add(e.destination.ip);
      if (e.threat?.technique?.id) techniqueIds.add(e.threat.technique.id);
      const risk = e.event?.risk_score ?? 0;
      if (risk > maxRiskScore) maxRiskScore = risk;
    }

    const summary = {
      firstEvent: events[0]?.["@timestamp"] ?? null,
      lastEvent: events[events.length - 1]?.["@timestamp"] ?? null,
      maxRiskScore,
      hosts: Array.from(hosts),
      users: Array.from(users),
      sourceIps: Array.from(sourceIps),
      destIps: Array.from(destIps),
      techniqueIds: Array.from(techniqueIds),
    };

    return NextResponse.json({ events, total, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
