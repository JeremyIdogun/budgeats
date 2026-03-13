"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface SuggestedCanonical {
  ingredientId: string;
  ingredientName: string;
  score: number;
}

interface UnmatchedProductItem {
  retailerProductId: string;
  retailerId: string;
  retailerProductName: string;
  productUrl: string;
  matchScore: number;
  explanation: string;
  suggestedCanonical: SuggestedCanonical[];
}

export function UnmatchedProductsClient() {
  const [items, setItems] = useState<UnmatchedProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/v1/products/unmatched", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load unmatched products");
        }
        const payload = (await response.json()) as { data?: UnmatchedProductItem[] };
        setItems(payload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load unmatched products");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Unmatched Products</h1>
          <p className="text-sm text-navy-muted">
            Products below confidence threshold with suggested canonical candidates.
          </p>
        </section>

        {isLoading && (
          <section className="rounded-lg border border-cream-dark bg-white p-6 text-sm text-navy-muted">
            Loading unmatched products...
          </section>
        )}

        {error && (
          <section className="rounded-lg border border-coral/30 bg-coral/10 p-6 text-sm text-coral">
            {error}
          </section>
        )}

        {!isLoading && !error && items.length === 0 && (
          <section className="rounded-lg border border-cream-dark bg-white p-6 text-sm text-navy-muted">
            No unmatched products right now.
          </section>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.retailerProductId} className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">{item.retailerProductName}</p>
                <p className="text-xs text-navy-muted">
                  {item.retailerId.toUpperCase()} · score {(item.matchScore * 100).toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-navy-muted">{item.explanation}</p>
                <p className="mt-2 text-xs text-teal">
                  Suggestions:{" "}
                  {item.suggestedCanonical
                    .map((suggestion) => `${suggestion.ingredientName} (${(suggestion.score * 100).toFixed(0)}%)`)
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
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
