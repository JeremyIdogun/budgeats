"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="flex justify-center">
          <BrandLogo href="/" variant="wordmark" align="center" />
        </header>

        <Card as="section" padding="lg" className="space-y-6">
          {submitted ? (
            <>
              <header>
                <h1 className="text-2xl font-bold text-navy">Check your inbox</h1>
                <p className="mt-1 text-sm text-navy-muted">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent
                  a password reset link.
                </p>
              </header>

              <p className="rounded-lg bg-teal/10 px-3 py-3 text-sm text-navy">
                Open the email on this device if you can. The secure link will
                bring you back to Loavish to choose a new password.
              </p>
            </>
          ) : (
            <>
              <header>
                <h1 className="text-2xl font-bold text-navy">Reset your password</h1>
                <p className="mt-1 text-sm text-navy-muted">
                  Enter the email address on your account and we&apos;ll send you a
                  secure recovery link.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FieldLabel>
                  Email
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-1"
                    autoComplete="email"
                  />
                </FieldLabel>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <Button type="submit" size="md" fullWidth disabled={loading}>
                  {loading ? "Sending reset link..." : "Send reset link"}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-navy-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-navy hover:underline">
              Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
