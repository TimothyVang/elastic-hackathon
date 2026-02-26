import { NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export async function GET() {
  try {
    const es = getESClient();

    // Count total alerts
    const countResp = await es.count({ index: "security-alerts" });
    const totalAlerts = countResp.count;

    // Severity aggregation
    const sevAgg = await es.search({
      index: "security-alerts",
      size: 0,
      aggs: {
        severity: {
          terms: { field: "alert.severity", size: 10 },
        },
      },
    });

    const sevBuckets = (
      sevAgg.aggregations?.severity as { buckets: { key: string; doc_count: number }[] }
    )?.buckets || [];

    const sevMap: Record<string, number> = {};
    for (const b of sevBuckets) {
      sevMap[b.key] = b.doc_count;
    }

    const severityCounts = [
      { name: "Critical", value: sevMap["critical"] || 0, color: "#ef4444" },
      { name: "High", value: sevMap["high"] || 0, color: "#f97316" },
      { name: "Medium", value: sevMap["medium"] || 0, color: "#eab308" },
      { name: "Low", value: sevMap["low"] || 0, color: "#22c55e" },
    ];

    // Events by hour (date_histogram)
    const histAgg = await es.search({
      index: "security-alerts",
      size: 0,
      aggs: {
        events_by_hour: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: "1h",
          },
        },
      },
    });

    const histBuckets = (
      histAgg.aggregations?.events_by_hour as {
        buckets: { key_as_string: string; doc_count: number }[];
      }
    )?.buckets || [];

    const eventsByHour = histBuckets.map((b) => ({
      hour: new Date(b.key_as_string).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      count: b.doc_count,
    }));

    // Category aggregation
    const catAgg = await es.search({
      index: "security-alerts",
      size: 0,
      aggs: {
        categories: {
          terms: { field: "event.category", size: 20 },
        },
      },
    });

    const catBuckets = (
      catAgg.aggregations?.categories as { buckets: { key: string; doc_count: number }[] }
    )?.buckets || [];

    const categoryCounts = catBuckets.map((b) => ({
      category: b.key,
      count: b.doc_count,
    }));

    // Recent alerts (top 10 by severity desc)
    const recentResp = await es.search({
      index: "security-alerts",
      size: 10,
      sort: [{ "event.severity": { order: "desc" } }, { "@timestamp": { order: "desc" } }],
      query: {
        exists: { field: "alert.severity" },
      },
    });

    const recentAlerts = recentResp.hits.hits.map((h) => h._source);

    return NextResponse.json({
      totalAlerts,
      criticalCount: sevMap["critical"] || 0,
      highCount: sevMap["high"] || 0,
      mediumCount: sevMap["medium"] || 0,
      lowCount: sevMap["low"] || 0,
      severityCounts,
      eventsByHour,
      categoryCounts,
      recentAlerts,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
