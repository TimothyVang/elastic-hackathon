import { NextRequest, NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";
import { ESQL_QUERIES } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const es = getESClient();
    const { searchParams } = new URL(request.url);
    const sourceIp = searchParams.get("source_ip");

    if (!sourceIp) {
      return NextResponse.json(
        { error: "source_ip parameter is required" },
        { status: 400 }
      );
    }

    const resp = await es.esql.query({
      query: ESQL_QUERIES.correlated_events_by_ip,
      params: [sourceIp],
      format: "json",
    });

    return NextResponse.json({
      columns: resp.columns,
      values: resp.values,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
