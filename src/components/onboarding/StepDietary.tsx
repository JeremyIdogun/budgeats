"use client";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
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
  const { dietary, toggleDietary, setNoDietaryPreference } = useOnboardingStore();
  const isNone = dietary.includes("none");

  return (
    <div className="space-y-7">
      <StepHeader
        step={3}
        onBack={onBack}
        title="Any dietary preferences?"
        description="We filter suggestions and flag incompatible ingredients automatically."
      />

      <div className="flex flex-wrap gap-2">
        {DIETARY_PREFERENCES.map(({ id, emoji, label }) => {
          const selected = dietary.includes(id) && !isNone;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleDietary(id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                selected
                  ? "border-navy bg-navy/5 text-navy"
                  : "border-cream-dark bg-white text-navy-muted hover:border-navy/25"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={setNoDietaryPreference}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            isNone
              ? "border-navy bg-navy/5 text-navy"
              : "border-cream-dark bg-white text-navy-muted hover:border-navy/25"
          }`}
        >
          No preference
        </button>
      </div>

      <Button type="button" onClick={onNext} size="lg" fullWidth>
        Continue
      </Button>
    </div>
  );
}
