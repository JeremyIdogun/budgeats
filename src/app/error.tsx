"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <h1 className="text-2xl font-extrabold text-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-navy-muted">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
