"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      role="img"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.21-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.07.72-2.43 1.14-4.07 1.14-3.13 0-5.79-2.11-6.74-4.95h-4v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.28A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.38-2.28V6.63h-4A12 12 0 0 0 0 12c0 1.93.46 3.76 1.26 5.37l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.81l3.42-3.42C17.95 1.22 15.24 0 12 0A11.99 11.99 0 0 0 1.26 6.63l4 3.09c.95-2.84 3.61-4.95 6.74-4.95z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      role="img"
    >
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.7 20v-7h2.35l.35-2.73H13.7V8.53c0-.8.22-1.34 1.36-1.34h1.45V4.75A19.6 19.6 0 0 0 14.4 4c-2.08 0-3.5 1.27-3.5 3.6v2.67H8.55V13h2.35v7h2.8z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      role="img"
    >
      <defs>
        <linearGradient id="ig-gradient" x1="0%" x2="100%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="6" fill="url(#ig-gradient)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.1" cy="6.9" r="1.2" fill="#fff" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setConfirmationSent(true);
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  }

  async function handleOAuthSignUp(provider: "google" | "facebook") {
    setOauthLoading(provider);
    setError(null);
    const supabase = createClient();

    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthError) {
      setOauthLoading(null);
      setError(oauthError.message);
    }
  }

  function handleInstagramClick() {
    setError(
      "Instagram sign-up is not supported by Supabase Auth directly yet. Use Google, Facebook, or email/password.",
    );
  }

  function handleUseDifferentEmail() {
    setConfirmationSent(false);
    setPassword("");
    setError(null);
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8 flex justify-center">
          <BrandLogo href="/" variant="wordmark" />
        </header>

        <section className="rounded-lg border border-cream-dark bg-white p-6 md:p-8">
          {confirmationSent ? (
            <div className="py-3 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-3xl">
                ✉️
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Check your inbox</h1>
              <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click
                it to activate your account and you&apos;ll be taken straight to
                setup.
              </p>
              <button
                type="button"
                onClick={handleUseDifferentEmail}
                className="mt-5 text-sm font-semibold text-navy hover:underline"
              >
                ← Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-navy">Create account</h1>
              <p className="mt-1 text-sm text-navy-muted">
                Sign up to begin your onboarding and meal planning setup.
              </p>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("google")}
                  disabled={loading || oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoogleIcon />
                  {oauthLoading === "google"
                    ? "Redirecting..."
                    : "Sign up with Google"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("facebook")}
                  disabled={loading || oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FacebookIcon />
                  {oauthLoading === "facebook"
                    ? "Redirecting..."
                    : "Sign up with Facebook"}
                </button>
                <button
                  type="button"
                  onClick={handleInstagramClick}
                  disabled={loading || oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <InstagramIcon />
                  Sign up with Instagram
                </button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-navy-muted">
                <span className="h-px flex-1 bg-cream-dark" />
                <span>or</span>
                <span className="h-px flex-1 bg-cream-dark" />
              </div>

              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-navy">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-navy/30"
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
                    className="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-navy/30"
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || oauthLoading !== null}
                  className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#172744] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-navy-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-navy hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
