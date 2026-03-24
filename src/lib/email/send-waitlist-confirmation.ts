import { render } from '@react-email/render';
import { WaitlistConfirmation } from './templates/WaitlistConfirmation';
import { resend, FROM_EMAIL } from './resend';

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loavish.com';
  const logoSrc = `${appUrl}/loavish-email-logo.png`;
  const html = await render(WaitlistConfirmation({ email, logoSrc }));

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You're on the Loavish waitlist 🎉",
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
