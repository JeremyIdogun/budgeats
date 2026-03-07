import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

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
  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-navy">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='%231e2d4e' fill-opacity='0.07'%3E%3Ccircle cx='9' cy='11' r='0.7'/%3E%3Ccircle cx='39' cy='22' r='0.6'/%3E%3Ccircle cx='72' cy='9' r='0.8'/%3E%3Ccircle cx='111' cy='19' r='0.6'/%3E%3Ccircle cx='128' cy='41' r='0.7'/%3E%3Ccircle cx='17' cy='56' r='0.7'/%3E%3Ccircle cx='52' cy='45' r='0.6'/%3E%3Ccircle cx='88' cy='62' r='0.7'/%3E%3Ccircle cx='121' cy='75' r='0.6'/%3E%3Ccircle cx='28' cy='93' r='0.7'/%3E%3Ccircle cx='63' cy='101' r='0.6'/%3E%3Ccircle cx='96' cy='109' r='0.8'/%3E%3Ccircle cx='133' cy='122' r='0.6'/%3E%3Ccircle cx='15' cy='128' r='0.7'/%3E%3Ccircle cx='74' cy='132' r='0.6'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(circle at 12% 8%, rgba(61,191,184,0.14), transparent 35%), radial-gradient(circle at 88% 12%, rgba(232,105,58,0.12), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(247,245,242,0.9))`,
          backgroundSize: "140px 140px, auto, auto, auto",
          backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 py-8 md:px-10 md:py-10">
        <header className="flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/onboarding"
            className="rounded-xl border border-cream-dark bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/25"
          >
            Start
          </Link>
        </header>

        <section className="pt-20 pb-14 md:pt-28 md:pb-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-navy-muted">
            Meal planning, simplified
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Eat well and stay on budget without overthinking groceries.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-muted">
            budgEAts helps you set a budget, pick your household needs, and get a
            clean plan you can follow each week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172744]"
            >
              Start onboarding
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-cream-dark bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/25"
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
              className="rounded-2xl border border-cream-dark bg-white p-6"
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
              href="/onboarding"
              className="rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172744]"
            >
              Continue
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
