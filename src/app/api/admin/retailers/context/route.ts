import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  return NextResponse.json(
    { error: "Retailer context persistence is temporarily unavailable." },
    { status: 503 },
  );
}
