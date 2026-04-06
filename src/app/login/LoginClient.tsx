"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedNext = searchParams.get("next");
  const nextPath =
    requestedNext && requestedNext.startsWith("/") ? requestedNext : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="flex justify-center">
          <BrandLogo href="/" variant="wordmark" align="center" />
        </header>

        <Card as="section" padding="lg" className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-navy">Sign in</h1>
            <p className="mt-1 text-sm text-navy-muted">
              Continue to your dashboard and synced meal plan.
            </p>
          </header>

          <form onSubmit={handleSignIn} className="space-y-4">
            <FieldLabel>
              Email
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1"
              />
            </FieldLabel>

            <FieldLabel>
              Password
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </FieldLabel>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-navy hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            {info && <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-navy">{info}</p>}

            <Button type="submit" size="md" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-navy-muted">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-navy hover:underline">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
