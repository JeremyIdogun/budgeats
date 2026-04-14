import { NextResponse } from "next/server";
import { launchFlags } from "@/lib/launch-flags";
import { listReviewQueue, setMatchDecision } from "@/lib/product-match-review";
import { requireAdminApiUser } from "@/lib/server/auth";
import { cacheDeleteByPrefix } from "@/lib/server/cache";

interface ReviewDecisionBody {
  retailerProductId?: unknown;
  decision?: unknown;
}

export async function GET() {
  if (!launchFlags.adminProductReview) {
    return NextResponse.json({ error: "Product review is disabled for this beta." }, { status: 404 });
  }

  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const queue = listReviewQueue();
  return NextResponse.json({
    data: queue,
    explanation: `Loaded ${queue.length} products in review queue.`,
  });
}

export async function POST(request: Request) {
  if (!launchFlags.adminProductReview) {
    return NextResponse.json({ error: "Product review is disabled for this beta." }, { status: 404 });
  }

  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  let body: ReviewDecisionBody;
  try {
    body = (await request.json()) as ReviewDecisionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const retailerProductId =
    typeof body.retailerProductId === "string" ? body.retailerProductId : "";
  const decision = body.decision === "approved" || body.decision === "rejected"
    ? body.decision
    : null;

  if (!retailerProductId || !decision) {
    return NextResponse.json(
      { error: "retailerProductId and decision (approved|rejected) are required" },
      { status: 400 },
    );
  }

  try {
    const updated = setMatchDecision({ retailerProductId, decision });
    await Promise.all([
      cacheDeleteByPrefix("pricing:ingredient"),
      cacheDeleteByPrefix("pricing:meal"),
      cacheDeleteByPrefix("pricing:basket"),
    ]);
    return NextResponse.json({
      data: updated,
      explanation: `Set ${retailerProductId} to ${decision}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update review decision" },
      { status: 404 },
    );
  }
}
