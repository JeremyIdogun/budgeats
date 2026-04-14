import { Resend } from "resend";

export class EmailConfigError extends Error {
  constructor(message = "Transactional email is not configured") {
    super(message);
    this.name = "EmailConfigError";
  }
}

export function isEmailConfigured(): boolean {
  return typeof process.env.RESEND_API_KEY === "string" && process.env.RESEND_API_KEY.trim().length > 0;
}

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new EmailConfigError("Missing RESEND_API_KEY environment variable");
  }

  return new Resend(apiKey);
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "hello@loavish.com";
}
