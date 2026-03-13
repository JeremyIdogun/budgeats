"use client";

import { useOnboardingStore } from "@/stores/onboarding-store";
import { DietaryPreference } from "@/types";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const DIETARY_PREFERENCES: { id: DietaryPreference; emoji: string; label: string }[] = [
  { id: "vegetarian", emoji: "🥦", label: "Vegetarian" },
  { id: "vegan", emoji: "🌱", label: "Vegan" },
  { id: "halal", emoji: "☪️", label: "Halal" },
  { id: "gluten-free", emoji: "🌾", label: "Gluten-free" },
  { id: "dairy-free", emoji: "🥛", label: "Dairy-free" },
];

export function StepDietary({ onNext, onBack }: Props) {
  const { dietary, toggleDietary, setNoDietaryPreference } =
    useOnboardingStore();

  const isNone = dietary.includes("none");

  return (
    <div>
      <button
        onClick={onBack}
        className="text-navy-muted text-sm mb-4 flex items-center gap-1 hover:text-navy transition-colors"
      >
        ← Back
      </button>
      <p className="text-xs font-semibold tracking-widest uppercase text-teal mb-3">
        Step 3 of 4
      </p>
      <h1 className="font-heading text-3xl font-extrabold text-navy leading-tight mb-2">
        Any dietary preferences?
      </h1>
      <p className="text-navy-muted text-sm leading-relaxed mb-8">
        We&apos;ll filter meal suggestions and flag incompatible ingredients
        automatically.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {DIETARY_PREFERENCES.map(({ id, emoji, label }) => (
          <button
            key={id}
            onClick={() => toggleDietary(id)}
            className={`flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-medium transition-colors duration-150
              ${
                dietary.includes(id) && !isNone
                  ? "border-coral bg-coral/10 text-navy"
                  : "border-cream-dark bg-white text-navy-muted hover:border-coral/40"
              }`}
          >
            <span>{emoji}</span> {label}
          </button>
        ))}
        <button
          onClick={setNoDietaryPreference}
          className={`flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-medium transition-colors duration-150
            ${
              isNone
                ? "border-navy-muted bg-cream text-navy"
                : "border-cream-dark bg-white text-navy-muted hover:border-navy-muted/40"
            }`}
        >
          ✓ No preference
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-lg bg-navy py-4 text-base font-bold text-white transition-colors duration-150 hover:bg-[#162340]"
      >
        Continue →
      </button>
    </div>
  );
}
