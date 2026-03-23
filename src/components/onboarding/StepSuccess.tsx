"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOnboardingStore } from "@/stores/onboarding-store";

interface StepSuccessProps {
  onComplete?: () => void;
}

export function StepSuccess({ onComplete }: StepSuccessProps) {
  const { budget, period, household, dietary, retailers } = useOnboardingStore();
  const router = useRouter();

  const budgetLabel = `£${budget} / ${period === "weekly" ? "week" : "month"}`;
  const householdLabel = `${household === 5 ? "5+" : household} ${household === 1 ? "person" : "people"}`;
  const dietLabel =
    dietary.length === 0 || dietary[0] === "none" ? "No dietary restrictions" : dietary.join(", ");
  const retailersLabel = `${retailers.length} retailer${retailers.length !== 1 ? "s" : ""} selected`;

  const summaryItems = [
    { label: budgetLabel, emphasis: true },
    { label: householdLabel, emphasis: true },
    { label: dietLabel, emphasis: false },
    { label: retailersLabel, emphasis: false },
  ];

  function handleContinue() {
    onComplete?.();
    router.push("/dashboard");
  }

  return (
    <div className="space-y-7 py-3 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 text-sm font-semibold uppercase tracking-[0.08em] text-teal">
        Done
      </div>

      <header>
        <h2 className="font-heading text-3xl font-bold text-navy">You're all set</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-navy-muted">
          Here's what we've configured. You can update these preferences at any time in settings.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2">
        {summaryItems.map(({ label, emphasis }) => (
          <span
            key={label}
            className={`rounded-full px-4 py-2 text-sm ${
              emphasis ? "bg-navy/8 font-medium text-navy" : "bg-cream text-navy-muted"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <Card padding="md" className="bg-cream text-left">
        <p className="text-sm font-semibold text-navy">Your Logismos advisor is ready</p>
        <p className="mt-1 text-sm text-navy-muted">
          Plan at least 3 meals and you'll start getting personalized cook-or-eat-out recommendations.
        </p>
      </Card>

      <Button type="button" variant="success" size="lg" fullWidth onClick={handleContinue}>
        Go to my dashboard
      </Button>
    </div>
  );
}
