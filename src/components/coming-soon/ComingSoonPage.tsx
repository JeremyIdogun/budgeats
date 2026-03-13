"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";

/* ── Waitlist form ── */
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
      <div className="flex items-center gap-3 rounded-2xl border border-teal-light bg-[#F0FAFA] px-5 py-4 text-sm font-medium text-navy">
        <span>🎉</span>
        <span>You&rsquo;re on the list! We&rsquo;ll be in touch soon.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2.5 rounded-2xl border bg-white px-5 py-2 shadow-card transition-all focus-within:shadow-[0_2px_24px_rgba(61,191,184,0.15)]"
      style={{
        borderColor: invalid ? "#E8693A" : "#EDEBE7",
        // @ts-expect-error CSS variable
        "--tw-ring-color": "transparent",
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
        className="flex-shrink-0 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-[#162340] hover:shadow-[0_4px_16px_rgba(30,45,78,0.2)]"
      >
        {cta}
      </button>
    </form>
  );
}

/* ── Feature cards data ── */
const FEATURES = [
  {
    title: "Meal planning with live budget impact",
    desc: "Plan your entire week on a 7-day grid. Your budget bar updates in real time as you add meals — no more end-of-week surprises.",
    iconBg: "#FFF2EC",
    icon: "📋",
    wide: true,
  },
  {
    title: "Smart shopping list",
    desc: "Your plan converts into a deduplicated, retailer-split list showing the cheapest option across Aldi, Tesco, Sainsbury's and more.",
    iconBg: "#F0FAFA",
    icon: "🛒",
  },
  {
    title: "Ingredient-level prices",
    desc: "Unit price normalisation and brand vs own-label comparison across the UK's major supermarkets — before you leave the house.",
    iconBg: "#F0FAFA",
    icon: "📊",
  },
  {
    title: "Smart swap suggestions",
    desc: "Going over budget? Loavish suggests cheaper meal or ingredient alternatives so you stay on track without compromise.",
    iconBg: "#FFF2EC",
    icon: "💡",
  },
  {
    title: "Waste risk alerts",
    desc: "Buying a full bag of spinach but only using 80g? We flag it and suggest how to use it up before it goes bad.",
    iconBg: "#F0FAFA",
    icon: "⏳",
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

/* ── Page ── */
export function ComingSoonPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream text-navy antialiased">
      {/* Fixed gradient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 80% -10%, rgba(61,191,184,0.13) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at -10% 80%, rgba(232,105,58,0.10) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Nav ── */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <BrandLogo />
        <div className="rounded-full bg-teal-light px-4 py-1.5 text-xs font-semibold tracking-wide text-navy">
          Coming Soon
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
        {/* Eyebrow */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-cream-dark bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-navy-muted"
          style={{ animation: "fadeUp 0.6s ease both" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          Now in development &mdash; join the waitlist
        </div>

        {/* Headline */}
        <h1
          className="mb-6 max-w-3xl text-navy"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "clamp(42px, 6vw, 80px)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-2px",
            animation: "fadeUp 0.6s 0.1s ease both",
          }}
        >
          Stop guessing.<br />
          Start eating{" "}
          <span className="text-coral">smarter.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="mb-12 max-w-xl text-lg leading-relaxed text-navy-muted"
          style={{ animation: "fadeUp 0.6s 0.2s ease both" }}
        >
          Loavish breaks your food spend down to the ingredient level &mdash; so
          you can plan meals, compare retailers, and hit your grocery budget every
          week.
        </p>

        {/* Form */}
        <div
          className="w-full max-w-md"
          style={{ animation: "fadeUp 0.6s 0.3s ease both" }}
        >
          <WaitlistForm />
          <p className="mt-3 text-xs text-navy-muted">
            No spam. Unsubscribe anytime. &middot; Free during beta.
          </p>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] uppercase tracking-widest text-navy-muted"
          style={{ animation: "fadeUp 0.6s 0.6s ease both" }}
        >
          <span>Scroll to explore</span>
          <span className="animate-bounce">↓</span>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="reveal grid grid-cols-1 gap-8 rounded-3xl bg-navy px-8 py-12 text-center md:grid-cols-3 md:px-12">
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

      {/* ── Features ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-teal">
          What Loavish does
        </p>
        <h2
          className="reveal mb-14 text-center text-navy"
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
          {/* Wide card */}
          <div className="reveal rounded-2xl border border-cream-dark bg-white p-8 transition-all hover:-translate-y-1 hover:border-teal-light hover:shadow-card-hover md:col-span-2">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{ background: "#FFF2EC" }}
            >
              📋
            </div>
            <h3
              className="mb-3 text-lg font-bold text-navy"
              style={{ fontFamily: "var(--font-display, sans-serif)" }}
            >
              Meal planning with live budget impact
            </h3>
            <p className="text-sm leading-relaxed text-navy-muted">
              Plan your entire week on a 7-day grid. As you add each meal, your
              budget bar updates in real time &mdash; so you always know exactly
              how much headroom you have before you shop.
            </p>
          </div>

          {FEATURES.slice(1).map((f) => (
            <div
              key={f.title}
              className="reveal rounded-2xl border border-cream-dark bg-white p-8 transition-all hover:-translate-y-1 hover:border-teal-light hover:shadow-card-hover"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: f.iconBg }}
              >
                {f.icon}
              </div>
              <h3
                className="mb-3 text-lg font-bold text-navy"
                style={{ fontFamily: "var(--font-display, sans-serif)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-navy-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 mx-auto max-w-lg px-6 pb-28 text-center">
        <h2
          className="reveal mb-4 text-navy"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          Be first to know<br />when we launch.
        </h2>
        <p className="reveal mb-8 text-base text-navy-muted">
          Early access users get free premium features during our beta period.
        </p>
        <div className="reveal">
          <WaitlistForm cta="Get early access →" />
          <p className="mt-3 text-xs text-navy-muted">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 bg-navy px-6 py-8 text-center md:px-12">
        <span className="relative block h-7 aspect-[758/232] overflow-hidden">
          <Image src="/loavish-brand-logo.svg" alt="Loavish" fill className="object-contain brightness-0 invert" sizes="104px" />
        </span>
        <ul className="flex list-none gap-6">
          <li>
            <a href="#" className="text-xs text-white/50 transition hover:text-white/90">
              Privacy
            </a>
          </li>
          <li>
            <a href="#" className="text-xs text-white/50 transition hover:text-white/90">
              Terms
            </a>
          </li>
          <li>
            <a
              href="mailto:hello@loavish.app"
              className="text-xs text-white/50 transition hover:text-white/90"
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
