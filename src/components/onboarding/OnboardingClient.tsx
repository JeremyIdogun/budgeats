"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { Card } from "@/components/ui/Card";
import { StepBudget } from "@/components/onboarding/StepBudget";
import { StepHousehold } from "@/components/onboarding/StepHousehold";
import { StepDietary } from "@/components/onboarding/StepDietary";
import { StepRetailers } from "@/components/onboarding/StepRetailers";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { createEmptyWeekPlan, getCurrentWeekStartDateIso } from "@/lib/planner";
import { poundsToPence } from "@/utils/currency";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBudgeAtsStore } from "@/store";
import type { DietaryTag, RetailerId, UserProfile } from "@/models";

type Step = 1 | 2 | 3 | 4 | 5;

export function OnboardingClient() {
  const [step, setStep] = useState<Step>(1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const store = useOnboardingStore();
  const setCanonicalUser = useBudgeAtsStore((state) => state.setUser);
  const setCurrentWeekPlan = useBudgeAtsStore((state) => state.setCurrentWeekPlan);
  const router = useRouter();

  const currentStep = Math.min(step, 4);
  const progress = (currentStep / 4) * 100;

  async function handleRetailersComplete() {
    if (savingProfile) return;
    try {
      setSavingProfile(true);
      setSaveError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/dashboard");
        return;
      }

      if (!store.household || store.retailers.length === 0) {
        return;
      }

      const dietaryPreferences = store.dietary.filter((tag): tag is DietaryTag => tag !== "none");
      const preferredRetailers = store.retailers as RetailerId[];
      const canonicalUser: UserProfile = {
        id: user.id,
        createdAt: new Date().toISOString(),
        budget: {
          amount: poundsToPence(store.budget),
          period: store.period,
        },
        household: {
          size: store.household,
        },
        dietaryPreferences,
        preferredRetailers,
        currency: "GBP",
        region: "UK",
      };

      setCanonicalUser(canonicalUser);
      setCurrentWeekPlan(createEmptyWeekPlan(user.id, getCurrentWeekStartDateIso()));

      const weekly_budget_pence =
        store.period === "weekly"
          ? store.budget * 100
          : Math.round((store.budget * 100) / 4.33);

      const { error: upsertError } = await supabase.from("user_profiles").upsert(
        {
          id: user.id,
          email: user.email!,
          household_size: store.household,
          weekly_budget_pence,
          budget_period: store.period,
          dietary_preferences: store.dietary,
          preferred_retailer_ids: store.retailers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        throw upsertError;
      }

      trackEvent("onboarding_completed", {
        household_size: store.household,
        budget_band:
          weekly_budget_pence > 10000
            ? "high"
            : weekly_budget_pence > 5000
              ? "medium"
              : "low",
        retailer_count: store.retailers.length,
      });

      setStep(5);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveError("We couldn't save your setup. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo variant="wordmark" />
          <div className="w-28 md:w-40">
            <p className="mb-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
              Step {currentStep} of 4
            </p>
            <div className="h-1 rounded-full bg-cream-dark">
              <div
                className="h-full rounded-full bg-navy transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <Card as="section" padding="lg" className="mx-auto w-full max-w-3xl">
          <div className="mx-auto w-full max-w-2xl">
            {step === 1 && <StepBudget onNext={() => setStep(2)} />}
            {step === 2 && <StepHousehold onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <StepDietary onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && (
              <StepRetailers
                onNext={handleRetailersComplete}
                onBack={() => setStep(3)}
                loading={savingProfile}
                error={saveError}
              />
            )}
            {step === 5 && <StepSuccess onComplete={store.reset} />}
          </div>
        </Card>

        <p className="pb-2 text-center text-xs text-navy-muted">
          Your data is stored securely and never sold. · Loavish © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
