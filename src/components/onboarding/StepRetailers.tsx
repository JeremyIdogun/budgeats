"use client";

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
    <div>
      <button
        onClick={onBack}
        className="text-navy-muted text-sm mb-4 flex items-center gap-1 hover:text-navy transition-colors"
      >
        ← Back
      </button>
      <p className="text-xs font-semibold tracking-widest uppercase text-teal mb-3">
        Step 4 of 4
      </p>
      <h1 className="font-heading text-3xl font-extrabold text-navy leading-tight mb-2">
        Where do you usually shop?
      </h1>
      <p className="text-navy-muted text-sm leading-relaxed mb-8">
        We&apos;ll estimate your basket across these stores and highlight the
        cheapest option each week.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {RETAILER_OPTIONS.map(({ id, label, initial, bg, color }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleRetailer(id)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors duration-150
                ${
                  isSelected
                    ? "border-teal bg-teal/10 text-navy"
                    : "border-cream-dark bg-white text-navy-muted hover:border-teal/40"
                }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-lg"
                style={{ background: bg, color }}
              >
                {initial}
              </div>
              {label}
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selected.length === 0}
        className="w-full rounded-lg bg-navy py-4 text-base font-bold text-white transition-colors duration-150 hover:bg-[#162340] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Let&apos;s go →
      </button>
    </div>
  );
}
