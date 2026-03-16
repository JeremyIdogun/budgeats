import { NextResponse } from "next/server";
import { listDecisionLog } from "@/lib/logismos-ledger";
import { createClient } from "@/lib/supabase/server";
import { captureServerError } from "@/lib/server/observability";

function parseAcceptedFilter(value: string | null): boolean | undefined {
  if (value === null || value.length === 0) return undefined;
  if (value === "accepted") return true;
  if (value === "dismissed") return false;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const url = new URL(request.url);
    const accepted = parseAcceptedFilter(url.searchParams.get("accepted"));
    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(500, Math.round(limitParam))
      : 200;

    const rows = await listDecisionLog({
      userId: user?.id ?? undefined,
      accepted,
      limit,
    });

    return NextResponse.json({
      data: rows,
      explanation: `Loaded ${rows.length} decision log entries.`,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.decisions.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load decisions" },
      { status: 500 },
    );
  }
}
