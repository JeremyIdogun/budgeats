import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendWaitlistConfirmation } from "@/lib/email/send-waitlist-confirmation";
import { EmailConfigError } from "@/lib/email/resend";
import { captureServerError } from "@/lib/server/observability";
import { applyRateLimitHeaders, enforceRateLimit } from "@/lib/server/rate-limit";

const schema = z.object({
  email: z.email(),
});

export async function POST(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, {
    name: "waitlist",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (rateLimit.response) return rateLimit.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return applyRateLimitHeaders(NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    ), rateLimit.state);
  }

  try {
    await sendWaitlistConfirmation(parsed.data.email);
    return applyRateLimitHeaders(NextResponse.json({ success: true }), rateLimit.state);
  } catch (error) {
    if (error instanceof EmailConfigError) {
      return applyRateLimitHeaders(NextResponse.json(
        {
          error: "Waitlist email is not configured yet. Please try again later.",
          code: "email_not_configured",
        },
        { status: 503 },
      ), rateLimit.state);
    }

    captureServerError(error, { event: "api.waitlist.post.failed" });
    return applyRateLimitHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join waitlist" },
      { status: 500 },
    ), rateLimit.state);
  }
}
