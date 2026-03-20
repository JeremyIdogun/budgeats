"use client";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { BudgetPeriod } from "@/types";

interface Props {
  onNext: () => void;
}

export const MIN_BUDGET = 20;
export const BASE_MAX_BUDGET = 300;
export const STEP = 5;
export const MAX_BUFFER = 100;

export function roundUpToStep(value: number) {
  return Math.ceil(value / STEP) * STEP;
}

export function StepBudget({ onNext }: Props) {
  const { budget, period, setBudget, setPeriod } = useOnboardingStore();
  const sliderMax = Math.max(BASE_MAX_BUDGET, roundUpToStep(budget + MAX_BUFFER));

  return (
    <div className="space-y-8">
      <StepHeader
        step={1}
        title="What's your food budget?"
        description="We'll use this to guide your weekly plan and keep spending predictable."
      />

      <section className="rounded-lg bg-cream px-5 py-4">
        <p className="font-heading text-4xl font-semibold tracking-tight text-navy">£{budget}</p>
        <p className="mt-1 text-sm text-navy-muted">per {period === "weekly" ? "week" : "month"}</p>
      </section>

      <div>
        <input
          type="range"
          min={MIN_BUDGET}
          max={sliderMax}
          step={STEP}
          value={budget}
          onChange={(e) => setBudget(Number.parseInt(e.target.value, 10))}
          className="budget-range"
        />
        <div className="mt-2 flex justify-between text-xs text-navy-muted">
          <span>£{MIN_BUDGET}</span>
          <span>£{sliderMax}</span>
        </div>
      </div>

      <FieldLabel>
        Exact amount (£)
        <Input
          type="number"
          min={MIN_BUDGET}
          step={1}
          value={budget}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(value)) setBudget(value);
          }}
          className="mt-2"
        />
      </FieldLabel>

      <div className="rounded-lg bg-cream p-1">
        <div className="grid grid-cols-2 gap-1">
          {(["weekly", "monthly"] as BudgetPeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                period === value
                  ? "bg-white text-navy shadow-[0_1px_2px_rgba(30,45,78,0.08)]"
                  : "text-navy-muted hover:text-navy"
              }`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Button type="button" onClick={onNext} size="lg" fullWidth>
        Continue
      </Button>
    </div>
  );
}
