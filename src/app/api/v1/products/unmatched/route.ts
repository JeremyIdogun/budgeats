import { NextResponse } from "next/server";
import { launchFlags } from "@/lib/launch-flags";
import { listUnmatchedProducts } from "@/lib/product-match-review";
import { requireAdminApiUser } from "@/lib/server/auth";

export async function GET() {
  if (!launchFlags.adminProductReview) {
    return NextResponse.json({ error: "Product review is disabled for this beta." }, { status: 404 });
  }

  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const rows = listUnmatchedProducts();
  return NextResponse.json({
    data: rows,
    explanation: `Loaded ${rows.length} unmatched products.`,
  });
}
