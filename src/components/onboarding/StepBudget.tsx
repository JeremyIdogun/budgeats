"use client";

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
  const sliderMax = Math.max(
    BASE_MAX_BUDGET,
    roundUpToStep(budget + MAX_BUFFER),
  );

  return (
    <div>
      <p className="text-xs font-semibold tracking-widest uppercase text-teal mb-3">
        Step 1 of 4
      </p>
      <h1 className="font-heading text-3xl font-extrabold text-navy leading-tight mb-2">
        What&apos;s your food budget?
      </h1>
      <p className="text-navy-muted text-sm leading-relaxed mb-9">
        We&apos;ll use this to guide your meal planning and flag when you&apos;re
        on
        track.
      </p>

      {/* Budget display */}
      <div className="text-center mb-8">
        <div className="font-heading text-6xl font-extrabold text-navy tracking-tight">
          <span className="text-coral text-4xl align-super">£</span>
          {budget}
        </div>
        <p className="text-navy-muted text-sm mt-1">
          per {period === "weekly" ? "week" : "month"}
        </p>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={MIN_BUDGET}
        max={sliderMax}
        step={STEP}
        value={budget}
        onChange={(e) => setBudget(parseInt(e.target.value, 10))}
        className="budget-range mb-2"
      />
      <div className="flex justify-between text-xs text-navy-muted mb-6">
        <span>£{MIN_BUDGET}</span>
        <span>£{sliderMax}</span>
      </div>

      <label className="mb-6 block text-sm text-navy">
        Exact amount (£)
        <input
          type="number"
          min={MIN_BUDGET}
          step={1}
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value, 10))}
          className="mt-2 w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-navy/30"
        />
      </label>

      {/* Period toggle */}
      <div className="flex bg-cream rounded-xl p-1 gap-1 w-fit mx-auto mb-9">
        {(["weekly", "monthly"] as BudgetPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-[9px] text-sm font-medium transition-all ${
              period === p ? "bg-white text-navy shadow-sm" : "text-navy-muted"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-[14px] bg-navy text-white font-heading font-bold text-base hover:bg-[#162340] hover:-translate-y-px transition-all"
      >
        Continue →
      </button>
    </div>
  );
}
