import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <h1 className="text-2xl font-extrabold text-navy">Page not found</h1>
      <p className="mt-2 text-sm text-navy-muted">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
