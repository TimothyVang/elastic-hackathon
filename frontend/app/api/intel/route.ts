import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export async function GET(request: NextRequest) {
  try {
    const es = getESClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    let query: object;
    if (q) {
      query = {
        multi_match: {
          query: q,
          fields: [
            "ioc.type",
            "ioc.value",
            "ioc.description",
            "threat.technique.id",
            "threat.technique.name",
            "threat.tactic.name",
            "severity",
            "tags",
            "source",
          ],
        },
      };
    } else {
      query = { match_all: {} };
    }

    let resp;
    try {
      resp = await es.search({
        index: "threat-intel",
        size: 100,
        sort: [{ confidence: { order: "desc", unmapped_type: "integer" } }],
        query,
      });
    } catch {
      // Fallback if sort field fails
      resp = await es.search({
        index: "threat-intel",
        size: 100,
        sort: [{ "@timestamp": { order: "desc" } }],
        query,
      });
    }

    return NextResponse.json({
      total: typeof resp.hits.total === "number" ? resp.hits.total : resp.hits.total?.value || 0,
      iocs: resp.hits.hits.map((h) => h._source),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
