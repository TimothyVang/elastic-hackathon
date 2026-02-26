import { NextResponse } from "next/server";
import { getESClient } from "@/lib/elasticsearch";

export async function GET() {
  try {
    const es = getESClient();
    const info = await es.info();
    return NextResponse.json({
      status: "ok",
      cluster: info.cluster_name,
      version: info.version?.number,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message },
      { status: 503 }
    );
  }
}
