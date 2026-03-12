import { NextResponse } from "next/server";
import { listIngestionRuns } from "@/lib/server/admin-metrics";

export async function GET() {
  const runs = await listIngestionRuns(200);
  return NextResponse.json({
    data: runs,
    explanation: `Loaded ${runs.length} ingestion runs.`,
  });
}
