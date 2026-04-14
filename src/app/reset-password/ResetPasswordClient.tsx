"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (userError || !user) {
        setError("This recovery link is invalid or has expired. Request a new reset email.");
        setReady(false);
        return;
      }

      setReady(true);
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="flex justify-center">
          <BrandLogo href="/" variant="wordmark" align="center" />
        </header>

        <Card as="section" padding="lg" className="space-y-6">
          {success ? (
            <>
              <header>
                <h1 className="text-2xl font-bold text-navy">Password updated</h1>
                <p className="mt-1 text-sm text-navy-muted">
                  Your password has been changed successfully.
                </p>
              </header>

              <Button
                type="button"
                size="md"
                fullWidth
                onClick={() => {
                  router.replace("/dashboard");
                  router.refresh();
                }}
              >
                Continue to dashboard
              </Button>
            </>
          ) : (
            <>
              <header>
                <h1 className="text-2xl font-bold text-navy">Choose a new password</h1>
                <p className="mt-1 text-sm text-navy-muted">
                  Set a new password for your Loavish account.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FieldLabel>
                  New password
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-1"
                    autoComplete="new-password"
                    disabled={!ready || loading}
                  />
                </FieldLabel>

                <FieldLabel>
                  Confirm password
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-1"
                    autoComplete="new-password"
                    disabled={!ready || loading}
                  />
                </FieldLabel>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <Button type="submit" size="md" fullWidth disabled={!ready || loading}>
                  {loading ? "Updating password..." : "Update password"}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-navy-muted">
            Need a new email?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-navy hover:underline"
            >
              Request another reset link
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
