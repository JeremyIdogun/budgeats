import { NextResponse } from "next/server";
import { getLaunchHealthReport } from "@/lib/server/launch-health";

export async function GET() {
  const report = await getLaunchHealthReport();
  return NextResponse.json(report, {
    status: report.overall === "blocked" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
