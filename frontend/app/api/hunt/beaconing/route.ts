import { NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";
import { ESQL_QUERIES } from "@/lib/queries";

export async function GET() {
  try {
    const es = getESClient();

    const resp = await es.esql.query({
      query: ESQL_QUERIES.beaconing_detection,
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
