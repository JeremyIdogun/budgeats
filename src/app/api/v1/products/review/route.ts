import { NextResponse } from "next/server";
import { listReviewQueue, setMatchDecision } from "@/lib/product-match-review";

interface ReviewDecisionBody {
  retailerProductId?: unknown;
  decision?: unknown;
}

export async function GET() {
  const queue = listReviewQueue();
  return NextResponse.json({
    data: queue,
    explanation: `Loaded ${queue.length} products in review queue.`,
  });
}

export async function POST(request: Request) {
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
