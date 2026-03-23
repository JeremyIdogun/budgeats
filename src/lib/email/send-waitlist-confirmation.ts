import fs from 'fs';
import path from 'path';
import { render } from '@react-email/render';
import { WaitlistConfirmation } from './templates/WaitlistConfirmation';
import { resend, FROM_EMAIL } from './resend';

function getLogoDataUri(): string {
  const logoPath = path.join(process.cwd(), 'public', 'loavish-email-logo.png');
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  const logoSrc = getLogoDataUri();
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
