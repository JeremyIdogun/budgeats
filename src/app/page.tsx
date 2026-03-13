import { ComingSoonPage } from "@/components/coming-soon/ComingSoonPage";
import Link from "next/link";
import Image from "next/image";

const highlights = [
  {
    title: "Budget-first planning",
    description: "Build a weekly meal plan from the amount you can actually spend.",
  },
  {
    title: "Retailer-aware picks",
    description: "Compare your preferred stores and choose the lower-cost basket.",
  },
  {
    title: "Less waste",
    description: "Reuse ingredients across meals so you buy less and throw away less.",
  },
];

export default function HomePage() {
  if (process.env.NEXT_PUBLIC_COMING_SOON === "true") {
    return <ComingSoonPage />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-navy">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal/5 to-transparent"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 py-8 md:px-10 md:py-10">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Loavish home" className="inline-flex items-center">
            <span className="relative block w-[190px] aspect-[520/230] md:w-[260px]">
              <Image
                src="/loavish-wordmark.svg"
                alt="Loavish"
                fill
                priority
                className="object-contain object-left"
                sizes="(min-width: 768px) 260px, 190px"
              />
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-cream-dark bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#172744]"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="pt-20 pb-14 md:pt-28 md:pb-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-navy-muted">
            Meal planning, simplified
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Eat well and stay on budget without overthinking groceries.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-muted">
            Loavish helps you set a budget, pick your household needs, and get a
            clean plan you can follow each week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#172744]"
            >
              Start with email
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-cream-dark bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
            >
              Learn more
            </a>
          </div>
        </section>

        <section
          id="features"
          className="grid gap-4 border-t border-cream-dark py-10 md:grid-cols-3"
        >
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-cream-dark bg-white p-6"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="border-t border-cream-dark py-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-base text-navy-muted">
              Ready to build your first weekly plan?
            </p>
            <Link
              href="/signup"
              className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#172744]"
            >
              Continue
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
