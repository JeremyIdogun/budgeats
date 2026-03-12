import { NextResponse } from "next/server";
import { RETAILERS } from "@/models/retailer";

export async function GET() {
  const data = Object.values(RETAILERS).map((retailer) => ({
    id: retailer.id,
    name: retailer.name,
    color: retailer.color,
    explanation: `Retailer ${retailer.name} is available for pricing comparison.`,
  }));

  return NextResponse.json({
    data,
    explanation: `Loaded ${data.length} retailers.`,
  });
}
