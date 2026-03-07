"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

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

  async function handleCreateAccount() {
    setLoading(true);
    setError(null);
    setInfo(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setInfo("Account created. If email confirmation is enabled, verify then sign in.");
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8 flex justify-center">
          <BrandLogo href="/" />
        </header>

        <section className="rounded-2xl border border-cream-dark bg-white p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-navy-muted">
            Continue to your dashboard and synced meal plan.
          </p>

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-navy">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-navy/30"
              />
            </label>

            <label className="block text-sm font-medium text-navy">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-navy/30"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-navy">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#172744] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button
            onClick={handleCreateAccount}
            disabled={loading || !email || !password}
            className="mt-3 w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create account
          </button>
        </section>
      </div>
    </main>
  );
}
