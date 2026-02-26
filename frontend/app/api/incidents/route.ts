import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export async function GET(request: NextRequest) {
  try {
    const es = getESClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const q = searchParams.get("q");

    const must: object[] = [];

    if (status) {
      must.push({ term: { "incident.status": status } });
    }
    if (priority) {
      must.push({ term: { "incident.priority": priority } });
    }
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["incident.title", "incident.description", "affected_hosts", "mitre_techniques"],
        },
      });
    }

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const resp = await es.search({
      index: "incident-log",
      size: 100,
      sort: [{ "@timestamp": { order: "desc" } }],
      query,
    });

    return NextResponse.json({
      total: typeof resp.hits.total === "number" ? resp.hits.total : resp.hits.total?.value || 0,
      incidents: resp.hits.hits.map((h) => h._source),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
