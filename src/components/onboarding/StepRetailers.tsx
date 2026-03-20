"use client";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/stores/onboarding-store";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export const RETAILER_OPTIONS = [
  {
    id: "tesco",
    label: "Tesco",
    initial: "T",
    bg: "#EEF4FF",
    color: "#005DAA",
  },
  {
    id: "sainsburys",
    label: "Sainsbury's",
    initial: "S",
    bg: "#FFF5E6",
    color: "#F07800",
  },
  { id: "aldi", label: "Aldi", initial: "A", bg: "#FFF0EE", color: "#E8693A" },
  { id: "lidl", label: "Lidl", initial: "L", bg: "#EEF7FF", color: "#0050AA" },
  { id: "asda", label: "Asda", initial: "A", bg: "#F0FFF4", color: "#007932" },
  {
    id: "morrisons",
    label: "Morrisons",
    initial: "M",
    bg: "#FFFBEE",
    color: "#F5A500",
  },
  {
    id: "waitrose",
    label: "Waitrose",
    initial: "W",
    bg: "#F0FAF0",
    color: "#006B3C",
  },
  { id: "coop", label: "Co-op", initial: "C", bg: "#F4EEFF", color: "#6B48C8" },
  {
    id: "ocado",
    label: "Ocado",
    initial: "O",
    bg: "#F5FFF5",
    color: "#5D9B00",
  },
];

export function StepRetailers({ onNext, onBack }: Props) {
  const { retailers: selected, toggleRetailer } = useOnboardingStore();

  return (
    <div className="space-y-7">
      <StepHeader
        step={4}
        onBack={onBack}
        title="Where do you usually shop?"
        description="We'll compare baskets across these stores and highlight the cheapest route."
      />

      <div className="grid grid-cols-3 gap-2">
        {RETAILER_OPTIONS.map(({ id, label, initial, bg, color }) => {
          const isSelected = selected.includes(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleRetailer(id)}
              className={`rounded-lg border px-2 py-4 text-sm font-medium transition-colors duration-150 ${
                isSelected
                  ? "border-navy bg-navy/5 text-navy"
                  : "border-cream-dark bg-white text-navy-muted hover:border-navy/25"
              }`}
            >
              <span
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md font-heading text-lg font-bold"
                style={{ background: bg, color }}
              >
                {initial}
              </span>
              <span className="block text-center">{label}</span>
              <span className="mt-1 block text-center text-[11px] text-navy-muted">
                {isSelected ? "Selected" : "Tap to select"}
              </span>
            </button>
          );
        })}
      </div>

      <Button type="button" onClick={onNext} size="lg" fullWidth disabled={selected.length === 0}>
        Let's go
      </Button>
    </div>
  );
}
