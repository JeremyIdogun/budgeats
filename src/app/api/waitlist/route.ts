import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWaitlistConfirmation } from '@/lib/email/send-waitlist-confirmation';

const schema = z.object({
  email: z.email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Valid email is required' },
      { status: 400 }
    );
  }

  await sendWaitlistConfirmation(parsed.data.email);
  return NextResponse.json({ success: true });
}
