import { NextResponse } from "next/server";
import { listUnmatchedProducts } from "@/lib/product-match-review";
import { requireAdminApiUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const rows = listUnmatchedProducts();
  return NextResponse.json({
    data: rows,
    explanation: `Loaded ${rows.length} unmatched products.`,
  });
}
