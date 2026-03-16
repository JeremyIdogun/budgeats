import { ComingSoonPage } from "@/components/coming-soon/ComingSoonPage";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";

const STATS = [
  {
    value: "£1,200",
    label: "Average annual overspend on groceries per UK household",
    className: "text-coral",
  },
  {
    value: "23%",
    label: "Of bought food is thrown away every week in the average home",
    className: "text-teal",
  },
  {
    value: "9 in 10",
    label: "Shoppers don't compare prices before they shop",
    className: "text-cream",
  },
] as const;

const FEATURES = [
  {
    title: "Meal planning with live budget impact",
    desc: "Plan your entire week on a 7-day grid. Your budget bar updates in real time as you add meals with clear remaining headroom.",
  },
  {
    title: "Smart shopping list",
    desc: "Your plan converts into a deduplicated, retailer-split list showing the cheapest option across Aldi, Tesco, Sainsbury's and more.",
  },
  {
    title: "Ingredient-level prices",
    desc: "Unit price normalisation and brand vs own-label comparison across the UK's major supermarkets before you leave the house.",
  },
  {
    title: "Smart swap suggestions",
    desc: "Going over budget? Loavish suggests cheaper meal or ingredient alternatives so you stay on track without compromise.",
  },
  {
    title: "Waste risk alerts",
    desc: "Buying a full bag of spinach but only using 80g? We flag it and suggest how to use it up before it goes bad.",
  },
] as const;

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
          <BrandLogo href="/" variant="wordmark" />
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Meal planning, simplified
          </p>
          <h1
            className="max-w-3xl text-navy"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "clamp(36px, 5vw, 68px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-2px",
            }}
          >
            <span className="text-coral">Eat well</span> and stay on budget without overthinking groceries.
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

        <div className="mb-10 grid grid-cols-1 gap-8 rounded-lg bg-navy px-8 py-12 text-center md:grid-cols-3 md:px-12">
          {STATS.map((stat) => (
            <div key={stat.value}>
              <div
                className={`mb-2 ${stat.className} leading-none`}
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: "clamp(36px, 5vw, 52px)",
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <section
          id="features"
          className="border-t border-cream-dark py-10"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-teal">
            What Loavish does
          </p>
          <h2
            className="mb-10 max-w-xl text-navy"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              lineHeight: 1.15,
            }}
          >
            Every feature earns its place
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-cream-dark bg-white p-6 transition-colors duration-150 hover:border-navy/15 md:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-coral/25 bg-coral/10 text-sm font-bold tracking-wide text-coral">
                01
              </div>
              <h3 className="mb-2 text-base font-bold" style={{ fontFamily: "var(--font-display, sans-serif)" }}>{FEATURES[0].title}</h3>
              <p className="text-sm leading-relaxed text-navy-muted">{FEATURES[0].desc}</p>
            </article>
            {FEATURES.slice(1).map((feature, i) => (
              <article
                key={feature.title}
                className="rounded-lg border border-cream-dark bg-white p-6 transition-colors duration-150 hover:border-navy/15"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold tracking-wide ${
                    i % 2 === 0
                      ? "border-teal/25 bg-teal/10 text-teal"
                      : "border-coral/25 bg-coral/10 text-coral"
                  }`}
                >
                  {String(i + 2).padStart(2, "0")}
                </div>
                <h3 className="mb-2 text-base font-bold" style={{ fontFamily: "var(--font-display, sans-serif)" }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed text-navy-muted">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

      </div>

      <section className="mx-auto max-w-6xl px-6 pb-28 pt-10 text-center md:px-10">
        <h2
          className="mb-4 text-navy"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          Stop guessing what to cook.
          <br />
          <span className="text-coral">Start planning</span> with confidence.
        </h2>
        <p className="mb-8 text-base text-navy-muted">
          Set your budget, pick your meals, and let Loavish handle the maths.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#172744]"
          >
            Start planning free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-cream-dark bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
          >
            Log in
          </Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 bg-navy px-6 py-8 md:px-12">
        <span className="relative block h-10 w-47.5 md:h-11 md:w-55">
          <Image
            src="/loavish-wordmark-white.svg"
            alt="Loavish"
            fill
            className="object-contain object-left"
            sizes="(min-width: 768px) 220px, 190px"
          />
        </span>
        <ul className="flex list-none gap-6">
          <li>
            <a href="#" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90">Privacy</a>
          </li>
          <li>
            <a href="#" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90">Terms</a>
          </li>
          <li>
            <a href="mailto:hello@loavish.app" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90">Contact</a>
          </li>
        </ul>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          &copy; 2025 Loavish. All rights reserved.
        </span>
      </footer>
    </main>
  );
}
