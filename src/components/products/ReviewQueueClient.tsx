"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface SuggestedCanonical {
  ingredientId: string;
  ingredientName: string;
  score: number;
}

interface ProductReviewItem {
  retailerProductId: string;
  retailerId: string;
  retailerProductName: string;
  productUrl: string;
  matchStatus: string;
  matchLabel: "exact" | "equivalent" | "substitute";
  matchScore: number;
  explanation: string;
  suggestedCanonical: SuggestedCanonical[];
}

async function loadReviewQueue(): Promise<ProductReviewItem[]> {
  const response = await fetch("/api/v1/products/review", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load review queue");
  const payload = (await response.json()) as { data?: ProductReviewItem[] };
  return payload.data ?? [];
}

export function ReviewQueueClient() {
  const [items, setItems] = useState<ProductReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        setItems(await loadReviewQueue());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review queue");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function submitDecision(retailerProductId: string, decision: "approved" | "rejected") {
    const response = await fetch("/api/v1/products/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ retailerProductId, decision }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Failed to update decision");
    }

    setItems((previous) => previous.filter((item) => item.retailerProductId !== retailerProductId));
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Product Match Review</h1>
          <p className="text-sm text-navy-muted">
            Approve or reject candidate matches with 0.65-0.90 confidence.
          </p>
        </section>

        {isLoading && (
          <section className="rounded-lg border border-cream-dark bg-white p-6 text-sm text-navy-muted">
            Loading review queue...
          </section>
        )}

        {error && (
          <section className="rounded-lg border border-coral/30 bg-coral/10 p-6 text-sm text-coral">
            {error}
          </section>
        )}

        {!isLoading && !error && items.length === 0 && (
          <section className="rounded-lg border border-cream-dark bg-white p-6 text-sm text-navy-muted">
            Review queue is empty.
          </section>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.retailerProductId} className="rounded-lg border border-cream-dark bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.retailerProductName}</p>
                    <p className="text-xs text-navy-muted">
                      {item.retailerId.toUpperCase()} · score {(item.matchScore * 100).toFixed(1)}%
                    </p>
                    <p className="mt-1 text-xs text-navy-muted">{item.explanation}</p>
                    <p className="mt-2 text-xs text-teal">
                      Suggested:{" "}
                      {item.suggestedCanonical
                        .map((suggestion) => suggestion.ingredientName)
                        .join(", ")}
                    </p>
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-navy underline underline-offset-2"
                    >
                      Open product
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => void submitDecision(item.retailerProductId, "approved")}
                      className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void submitDecision(item.retailerProductId, "rejected")}
                      className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
