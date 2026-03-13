import { NextResponse } from "next/server";
import { listRetailerContexts, upsertRetailerContext } from "@/lib/logismos-ledger";
import { createClient } from "@/lib/supabase/server";
import { cacheDeleteByPrefix } from "@/lib/server/cache";

interface RetailerContextBody {
  retailerId?: unknown;
  postcode?: unknown;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await request.json()) as RetailerContextBody;
    const retailerId = typeof body.retailerId === "string" ? body.retailerId.trim().toLowerCase() : "";
    const postcode = typeof body.postcode === "string" ? body.postcode.trim().toUpperCase() : null;

    if (!retailerId) {
      return NextResponse.json({ error: "retailerId is required" }, { status: 400 });
    }

    const row = await upsertRetailerContext({
      userId: user?.id ?? "anonymous",
      retailerId,
      postcode,
      contextJson: {
        retailerId,
        postcode,
      },
    });
    await Promise.all([
      cacheDeleteByPrefix("pricing:basket"),
      cacheDeleteByPrefix("pricing:meal"),
    ]);

    return NextResponse.json({
      data: row,
      explanation: `Saved retailer context for ${retailerId}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save retailer context" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const rows = await listRetailerContexts({ userId: user?.id ?? "anonymous" });

    return NextResponse.json({
      data: rows,
      explanation: `Loaded ${rows.length} retailer context rows.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load retailer context" },
      { status: 500 },
    );
  }
}
