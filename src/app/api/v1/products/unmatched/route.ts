import { NextResponse } from "next/server";
import { listUnmatchedProducts } from "@/lib/product-match-review";

export async function GET() {
  const rows = listUnmatchedProducts();
  return NextResponse.json({
    data: rows,
    explanation: `Loaded ${rows.length} unmatched products.`,
  });
}
