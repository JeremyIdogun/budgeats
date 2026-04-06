import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Card } from "@/components/ui/Card";

interface DocumentLayoutProps {
  title: string;
  subtitle: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function DocumentLayout({
  title,
  subtitle,
  updatedAt,
  children,
}: DocumentLayoutProps) {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <BrandLogo href="/" variant="wordmark" />
          <Link
            href="/signup"
            className="rounded-lg border border-cream-dark bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
          >
            Create account
          </Link>
        </header>

        <Card as="section" padding="lg" className="space-y-6">
          <header className="space-y-3 border-b border-cream-dark pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              Loavish
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-navy">{title}</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-navy-muted">
                {subtitle}
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.12em] text-navy-muted">
              Last updated {updatedAt}
            </p>
          </header>

          <div className="space-y-6 text-sm leading-7 text-navy-muted">
            {children}
          </div>
        </Card>
      </div>
    </main>
  );
}
