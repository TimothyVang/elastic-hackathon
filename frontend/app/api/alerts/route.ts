import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export async function GET(request: NextRequest) {
  try {
    const es = getESClient();
    const { searchParams } = new URL(request.url);

    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const from = parseInt(searchParams.get("from") || "0", 10);
    const size = Math.min(parseInt(searchParams.get("size") || "50", 10), 200);

    const must: object[] = [];

    if (severity) {
      must.push({ term: { "alert.severity": severity } });
    }
    if (category) {
      must.push({ term: { "event.category": category } });
    }
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["message", "source.ip", "destination.ip", "host.name", "user.name", "process.name"],
        },
      });
    }

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const resp = await es.search({
      index: "security-alerts",
      from,
      size,
      sort: [{ "@timestamp": { order: "desc" } }],
      query,
    });

    return NextResponse.json({
      total: typeof resp.hits.total === "number" ? resp.hits.total : resp.hits.total?.value || 0,
      alerts: resp.hits.hits.map((h) => h._source),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
