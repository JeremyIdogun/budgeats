"use client";

import { useState } from "react";
import { StepBudget } from "@/components/onboarding/StepBudget";
import { StepHousehold } from "@/components/onboarding/StepHousehold";
import { StepDietary } from "@/components/onboarding/StepDietary";
import { StepRetailers } from "@/components/onboarding/StepRetailers";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const store = useOnboardingStore();
  const router = useRouter();

  // Save profile to Supabase when step 4 is completed
  async function handleRetailersComplete() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Convert pounds to pence for storage
      const weekly_budget_pence =
        store.period === "weekly"
          ? store.budget * 100
          : Math.round((store.budget * 100) / 4.33); // monthly → weekly

      await supabase.from("user_profiles").upsert({
        id: user.id,
        email: user.email!,
        household_size: store.household!,
        weekly_budget_pence,
        budget_period: store.period,
        dietary_preferences: store.dietary,
        preferred_retailer_ids: store.retailers,
        updated_at: new Date().toISOString(),
      });

      setStep(5);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-3 pt-3 md:px-6 md:pt-4">
      <div className="flex-1 flex items-start justify-center">
        <div className="bg-white rounded-[42px] shadow-card w-full max-w-5xl p-8 md:p-14 lg:p-20 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-coral to-coral-light" />

          <div className="mx-auto w-full max-w-3xl">
            {step === 1 && <StepBudget onNext={() => setStep(2)} />}
            {step === 2 && (
              <StepHousehold
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepDietary
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StepRetailers
                onNext={handleRetailersComplete}
                onBack={() => setStep(3)}
              />
            )}
            {step === 5 && <StepSuccess />}
          </div>
        </div>
      </div>

      <p className="text-center pt-14 pb-6 text-[14px] md:text-[22px] text-navy-muted">
        Your data is stored securely and never sold. · budgEAts © 2025
      </p>
    </div>
  );
}
