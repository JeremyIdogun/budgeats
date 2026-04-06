import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/server/auth";

function unavailableResponse() {
  return NextResponse.json(
    { error: "Retailer context persistence is temporarily unavailable." },
    { status: 503 },
  );
}

export async function POST() {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;
  return unavailableResponse();
}

export async function GET() {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth.response;
  return unavailableResponse();
}
