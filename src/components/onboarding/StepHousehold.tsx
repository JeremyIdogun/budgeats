"use client";

import { useOnboardingStore } from "@/stores/onboarding-store";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const options = [
  { size: 1, label: "Just me" },
  { size: 2, label: "Couple" },
  { size: 3, label: "Small" },
  { size: 4, label: "Family" },
  { size: 5, label: "Large" },
];

export function StepHousehold({ onNext, onBack }: Props) {
  const { household, setHousehold } = useOnboardingStore();

  return (
    <div>
      <button
        onClick={onBack}
        className="text-navy-muted text-sm mb-4 flex items-center gap-1 hover:text-navy transition-colors"
      >
        ← Back
      </button>
      <p className="text-xs font-semibold tracking-widest uppercase text-teal mb-3">
        Step 2 of 4
      </p>
      <h1 className="font-heading text-3xl font-extrabold text-navy leading-tight mb-2">
        How many people are you shopping for?
      </h1>
      <p className="text-navy-muted text-sm leading-relaxed mb-8">
        We'll scale ingredient quantities and cost estimates to your household.
      </p>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {options.map(({ size, label }) => (
          <button
            key={size}
            onClick={() => setHousehold(size)}
            className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all font-heading font-bold text-xl
              ${
                household === size
                  ? "border-teal bg-teal/10 text-navy"
                  : "border-cream-dark bg-white text-navy-muted hover:border-teal/40"
              }`}
          >
            {size === 5 ? "5+" : size}
            <span className="font-body font-normal text-[10px]">{label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-navy-muted mb-7">
        You can adjust this anytime in settings.
      </p>

      <button
        onClick={onNext}
        disabled={!household}
        className="w-full py-4 rounded-[14px] bg-navy text-white font-heading font-bold text-base hover:bg-[#162340] hover:-translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
      >
        Continue →
      </button>
    </div>
  );
}
