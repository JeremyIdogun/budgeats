"use client";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const HOUSEHOLD_OPTIONS = [
  { size: 1, label: "Just me" },
  { size: 2, label: "Couple" },
  { size: 3, label: "Small" },
  { size: 4, label: "Family" },
  { size: 5, label: "Large" },
];

export function StepHousehold({ onNext, onBack }: Props) {
  const { household, setHousehold } = useOnboardingStore();

  return (
    <div className="space-y-7">
      <StepHeader
        step={2}
        onBack={onBack}
        title="How many people are you shopping for?"
        description="We scale quantities and prices to your household size."
      />

      <div className="grid grid-cols-5 gap-2">
        {HOUSEHOLD_OPTIONS.map(({ size, label }) => {
          const selected = household === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setHousehold(size)}
              className={`aspect-square rounded-lg border px-1 transition-colors duration-150 ${
                selected
                  ? "border-navy bg-navy/5 text-navy"
                  : "border-cream-dark bg-white text-navy-muted hover:border-navy/25"
              }`}
            >
              <span className="block font-heading text-xl font-bold">{size === 5 ? "5+" : size}</span>
              <span className="mt-1 block text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-navy-muted">You can change this anytime in settings.</p>

      <Button type="button" onClick={onNext} size="lg" fullWidth disabled={!household}>
        Continue
      </Button>
    </div>
  );
}
