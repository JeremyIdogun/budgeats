"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function WaitlistForm({ cta = "Join waitlist →" }: { cta?: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSubmitted(true);
    // TODO: POST to waitlist endpoint (e.g. Resend / Loops)
    console.log("Waitlist signup:", email);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-teal-light bg-[#F0FAFA] px-5 py-4 text-sm font-medium text-navy">
        <span>You&rsquo;re on the list! We&rsquo;ll be in touch soon.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2.5 rounded-lg border bg-white px-5 py-2"
      style={{
        borderColor: invalid ? "#E8693A" : "#EDEBE7",
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setInvalid(false);
        }}
        placeholder="your@email.com"
        autoComplete="email"
        className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-navy-muted"
      />
      <button
        type="submit"
        className="flex-shrink-0 rounded-lg bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#162340]"
      >
        {cta}
      </button>
    </form>
  );
}

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

export function ComingSoonPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream text-navy antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal/5 to-transparent"
      />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" aria-label="Loavish home" className="inline-flex items-center">
          <span className="relative block h-10 w-[190px] md:h-14 md:w-[280px]">
            <Image
              src="/loavish-wordmark.svg"
              alt="Loavish"
              fill
              priority
              className="object-contain object-left"
              sizes="(min-width: 768px) 280px, 190px"
            />
          </span>
        </Link>
        <div className="rounded-full bg-teal-light px-4 py-1.5 text-xs font-semibold tracking-wide text-navy">
          Coming Soon
        </div>
      </nav>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-20 md:pt-24 text-center">
        <p className="mb-8 text-[11px] font-medium uppercase tracking-widest text-navy-muted">
          Now in development - join the waitlist
        </p>

        <h1
          className="mb-6 max-w-3xl text-navy"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "clamp(42px, 6vw, 80px)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-2px",
          }}
        >
          Stop guessing.
          <br />
          Start eating <span className="text-coral">smarter.</span>
        </h1>

        <p className="mb-12 max-w-xl text-lg leading-relaxed text-navy-muted">
          Loavish breaks your food spend down to the ingredient level so you can
          plan meals, compare retailers, and hit your grocery budget every week.
        </p>

        <div className="w-full max-w-md">
          <WaitlistForm />
          <p className="mt-3 text-xs text-navy-muted">
            No spam. Unsubscribe anytime. &middot; Free during beta.
          </p>
        </div>

        <div className="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] uppercase tracking-widest text-navy-muted">
          <span>Scroll to explore</span>
          <span>↓</span>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-8 rounded-lg bg-navy px-8 py-12 text-center md:grid-cols-3 md:px-12">
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
              <div
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          What Loavish does
        </p>
        <h2
          className="mb-14 text-center text-navy"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          Every feature earns its place
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-cream-dark bg-white p-8 transition-colors duration-150 hover:border-navy/15 md:col-span-2">
            <h3
              className="mb-3 text-lg font-bold text-navy"
              style={{ fontFamily: "var(--font-display, sans-serif)" }}
            >
              {FEATURES[0].title}
            </h3>
            <p className="text-sm leading-relaxed text-navy-muted">
              {FEATURES[0].desc}
            </p>
          </div>

          {FEATURES.slice(1).map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-cream-dark bg-white p-8 transition-colors duration-150 hover:border-navy/15"
            >
              <h3
                className="mb-3 text-lg font-bold text-navy"
                style={{ fontFamily: "var(--font-display, sans-serif)" }}
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-navy-muted">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-lg px-6 pb-28 text-center">
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
          Be first to know
          <br />
          when we launch.
        </h2>
        <p className="mb-8 text-base text-navy-muted">
          Early access users get free premium features during our beta period.
        </p>
        <div>
          <WaitlistForm cta="Get early access →" />
          <p className="mt-3 text-xs text-navy-muted">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 bg-navy px-6 py-8 text-center md:px-12">
        <span className="relative block h-10 w-[190px] md:h-11 md:w-[220px]">
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
            <a href="#" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90">
              Privacy
            </a>
          </li>
          <li>
            <a href="#" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90">
              Terms
            </a>
          </li>
          <li>
            <a
              href="mailto:hello@loavish.app"
              className="text-xs text-white/50 transition-colors duration-150 hover:text-white/90"
            >
              Contact
            </a>
          </li>
        </ul>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          &copy; 2025 Loavish. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
