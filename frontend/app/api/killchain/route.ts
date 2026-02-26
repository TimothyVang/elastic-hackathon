import { NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const es = getESClient();

    // Aggregate security alerts by MITRE tactic + technique
    const result = await es.search({
      index: "security-alerts",
      size: 0,
      body: {
        query: {
          bool: {
            must: [
              { exists: { field: "threat.tactic.name" } },
              { exists: { field: "threat.technique.id" } },
            ],
          },
        },
        aggs: {
          tactics: {
            terms: {
              field: "threat.tactic.name",
              size: 20,
            },
            aggs: {
              technique: {
                top_hits: {
                  size: 1,
                  _source: [
                    "threat.technique.id",
                    "threat.technique.name",
                  ],
                },
              },
            },
          },
        },
      },
    });

    const buckets =
      (result.aggregations?.tactics as { buckets: Array<{
        key: string;
        doc_count: number;
        technique: { hits: { hits: Array<{ _source: Record<string, unknown> }> } };
      }> })?.buckets || [];

    const stages = buckets.map((bucket) => {
      const hit = bucket.technique?.hits?.hits?.[0]?._source as {
        threat?: {
          technique?: { id?: string; name?: string };
        };
      } | undefined;
      return {
        tactic: bucket.key,
        techniqueId: hit?.threat?.technique?.id || "—",
        techniqueName: hit?.threat?.technique?.name || "—",
        count: bucket.doc_count,
      };
    });

    return NextResponse.json({ stages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
