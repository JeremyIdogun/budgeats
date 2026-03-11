"use client";

import { useOnboardingStore } from "@/stores/onboarding-store";
import { useRouter } from "next/navigation";

interface StepSuccessProps {
  onComplete?: () => void;
}

export function StepSuccess({ onComplete }: StepSuccessProps) {
  const { budget, period, household, dietary, retailers } =
    useOnboardingStore();
  const router = useRouter();

  const budgetLabel = `£${budget} / ${period === "weekly" ? "week" : "month"}`;
  const householdLabel = `${household === 5 ? "5+" : household} ${household === 1 ? "person" : "people"}`;
  const dietLabel =
    dietary.length === 0 || dietary[0] === "none"
      ? "No dietary restrictions"
      : dietary.join(", ");
  const retailersLabel = `${retailers.length} retailer${retailers.length !== 1 ? "s" : ""} selected`;

  const summaryItems = [
    { label: budgetLabel, highlight: true },
    { label: householdLabel, highlight: true },
    { label: dietLabel, highlight: false },
    { label: retailersLabel, highlight: false },
  ];

  function handleContinue() {
    onComplete?.();
    router.push("/dashboard");
  }

  return (
    <div className="text-center py-5">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto mb-6 animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
        👍
      </div>
      <h2 className="font-heading text-3xl font-extrabold text-navy mb-3">
        You&apos;re all set!
      </h2>
      <p className="text-navy-muted text-sm leading-relaxed mb-8">
        Here&apos;s what we&apos;ve set up for you. You can update any of this
        in your profile settings.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {summaryItems.map(({ label, highlight }) => (
          <span
            key={label}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              highlight ? "bg-teal/20 text-navy" : "bg-cream text-navy"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-teal/30 bg-teal/5 px-5 py-4 text-left">
        <p className="text-sm font-semibold text-navy">
          Your Logismos advisor is ready
        </p>
        <p className="mt-1 text-sm text-navy-muted">
          Plan 3 meals on the dashboard and Logismos will start giving you
          personalised cook-or-eat-out recommendations — and reward you with
          LoavishPoints for every smart decision.
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 rounded-[14px] bg-teal text-white font-heading font-bold text-base hover:-translate-y-px transition-all"
      >
        Go to my dashboard →
      </button>
    </div>
  );
}
